import { randomUUID } from "node:crypto";
import { MatchKind, matchWorkout } from "@titan/concept2/match";
import { normalizeWorkout } from "@titan/concept2/normalize";
import { fetchResults, refreshToken } from "@titan/concept2/oauth";
import { upsertConnection } from "@titan/db/external-connections";
import { insertExternalWorkout } from "@titan/db/external-workouts";
import { listWorkoutSessions } from "@titan/db/workout-sessions";
import type {
  ExternalConnection,
  ExternalWorkout,
} from "@titan/domain/external";
import { db } from "../db";
import { USER_ID } from "../user";

/** Import Concept2 results from the last two months. */
const LOOKBACK_DAYS = 60;

/** How many recent sessions to consider as match candidates for an import. */
const CANDIDATE_SESSION_LIMIT = 200;

/** One imported workout and whether this sync was the one that first stored it
 *  (re-syncs are idempotent, so an already-known workout reports `inserted:
 *  false` while still carrying its freshly-computed match). */
export type ImportOutcome = { inserted: boolean; workout: ExternalWorkout };

/**
 * Fetch the athlete's recent Concept2 results, normalize and match each to a
 * planned session, and persist them (idempotently). Shared by the manual sync
 * endpoint and the per-session match check so both go through the same import
 * and matching path.
 */
export const importConcept2Results = async (
  connection: ExternalConnection,
  clientId: string,
  clientSecret: string,
): Promise<ImportOutcome[]> => {
  const active = await ensureFreshToken(connection, clientId, clientSecret);
  const results = await fetchResults({
    accessToken: active.accessToken,
    from: isoDaysAgo(LOOKBACK_DAYS),
  });
  const sessions = await listWorkoutSessions(
    db,
    USER_ID,
    CANDIDATE_SESSION_LIMIT,
  );
  return Promise.all(
    results.map(async (raw) => {
      const normalized = normalizeWorkout(raw);
      const match = matchWorkout(normalized, sessions);
      const workout: ExternalWorkout = {
        connectionId: connection.id,
        externalId: String(raw.id),
        id: randomUUID(),
        importedAt: new Date().toISOString(),
        matchStatus: match.kind === MatchKind.Matched ? "matched" : "unmatched",
        normalized,
        provider: "concept2",
        raw,
        userId: USER_ID,
        ...(match.kind === MatchKind.Matched
          ? {
              matchedSlotId: match.slotId,
              matchedWorkoutSessionId: match.workoutSessionId,
            }
          : {}),
      };
      return { inserted: await insertExternalWorkout(db, workout), workout };
    }),
  );
};

const ensureFreshToken = async (
  connection: ExternalConnection,
  clientId: string,
  clientSecret: string,
): Promise<ExternalConnection> => {
  if (connection.expiresAt > Date.now()) {
    return connection;
  } else {
    const token = await refreshToken({
      clientId,
      clientSecret,
      refreshToken: connection.refreshToken,
    });
    const refreshed: ExternalConnection = {
      ...connection,
      accessToken: token.access_token,
      expiresAt: Date.now() + token.expires_in * 1000,
      refreshToken: token.refresh_token,
      scope: token.scope,
    };
    await upsertConnection(db, refreshed);
    return refreshed;
  }
};

const isoDaysAgo = (days: number): string =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
