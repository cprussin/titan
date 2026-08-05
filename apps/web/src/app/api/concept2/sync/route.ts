import { randomUUID } from "node:crypto";
import { MatchKind, matchWorkout } from "@titan/concept2/match";
import { normalizeWorkout } from "@titan/concept2/normalize";
import { fetchResults, refreshToken } from "@titan/concept2/oauth";
import {
  getConnection,
  upsertConnection,
} from "@titan/db/external-connections";
import { insertExternalWorkout } from "@titan/db/external-workouts";
import { listWorkoutSessions } from "@titan/db/workout-sessions";
import type {
  ExternalConnection,
  ExternalWorkout,
} from "@titan/domain/external";
import { NextResponse } from "next/server";
import { apiAuthGuard } from "../../../../auth/session";
import { db } from "../../../../db";
import { env } from "../../../../env";
import { USER_ID } from "../../../../user";

/** Import Concept2 results from the last two months. */
const LOOKBACK_DAYS = 60;

export const POST = async (): Promise<Response> => {
  const guard = await apiAuthGuard();
  if (guard !== undefined) {
    return guard;
  } else if (
    env.CONCEPT2_CLIENT_ID === undefined ||
    env.CONCEPT2_CLIENT_SECRET === undefined
  ) {
    return NextResponse.json(
      { error: "Concept2 is not configured" },
      { status: 400 },
    );
  } else {
    const connection = await getConnection(db, USER_ID, "concept2");
    return connection === undefined
      ? NextResponse.json({ error: "not connected" }, { status: 400 })
      : NextResponse.json({
          imported: await importResults(
            connection,
            env.CONCEPT2_CLIENT_ID,
            env.CONCEPT2_CLIENT_SECRET,
          ),
        });
  }
};

const importResults = async (
  connection: ExternalConnection,
  clientId: string,
  clientSecret: string,
): Promise<number> => {
  const active = await ensureFreshToken(connection, clientId, clientSecret);
  const results = await fetchResults({
    accessToken: active.accessToken,
    from: isoDaysAgo(LOOKBACK_DAYS),
  });
  const sessions = await listWorkoutSessions(db, USER_ID, 200);
  const inserted = await Promise.all(
    results.map((raw) => {
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
          ? { matchedWorkoutSessionId: match.workoutSessionId }
          : {}),
      };
      return insertExternalWorkout(db, workout);
    }),
  );
  return inserted.filter(Boolean).length;
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
