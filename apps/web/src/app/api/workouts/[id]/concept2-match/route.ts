import type { SlotMatch } from "@titan/concept2/match";
import { matchSlot, SlotMatchKind } from "@titan/concept2/match";
import { getConnection } from "@titan/db/external-connections";
import { getWorkoutSession } from "@titan/db/workout-sessions";
import { NextResponse } from "next/server";
import { apiAuthGuard } from "../../../../../auth/session";
import { concept2MatchRequestSchema } from "../../../../../concept2-match-request";
import { Concept2MatchResult } from "../../../../../concept2-match-result";
import { db } from "../../../../../db";
import { env } from "../../../../../env";
import { importConcept2Results } from "../../../../../server/import-concept2-results";
import { USER_ID } from "../../../../../user";

/**
 * Sync Concept2 and report whether any imported row is the cardio slot the
 * athlete is logging, identified by the session `id` and the `slotId` in the
 * request body. The import refreshes the athlete's recent results (the same path
 * the manual sync uses); this handler then picks the row that hits that slot's
 * target exactly, so the slot claims its own effort — a 10k slot takes the 10k
 * rather than a 500 m warm-up that shares the day. A row already logged, or one
 * finished mid-workout and surfaced on a later poll, is recorded automatically;
 * when several rows hit the target the client is handed all of them to ask the
 * athlete about, since only they know which piece they meant.
 */
export const POST = async (
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> => {
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
    const { id } = await context.params;
    const { slotId } = concept2MatchRequestSchema.parse(await request.json());
    const [connection, session] = await Promise.all([
      getConnection(db, USER_ID, "concept2"),
      getWorkoutSession(db, id),
    ]);
    const slot = session?.prescribedExercises.find(
      (exercise) => exercise.slotId === slotId,
    );
    if (connection === undefined) {
      return NextResponse.json({ error: "not connected" }, { status: 400 });
    } else if (session === undefined) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    } else if (slot === undefined) {
      return NextResponse.json({ error: "unknown slot" }, { status: 400 });
    } else {
      const outcomes = await importConcept2Results(
        connection,
        env.CONCEPT2_CLIENT_ID,
        env.CONCEPT2_CLIENT_SECRET,
      );
      const match = matchSlot(
        slot.prescription,
        session.scheduledDate,
        outcomes.map((outcome) => outcome.workout.normalized),
      );
      return NextResponse.json(toResponse(match));
    }
  }
};

/** Map the matcher's in-memory union onto the wire one — the memory enum never
 *  leaves the process (see DISCRIMINATED_UNIONS.md). */
const toResponse = (match: SlotMatch) => {
  switch (match.kind) {
    case SlotMatchKind.Matched: {
      return Concept2MatchResult.Matched(match.normalized);
    }
    case SlotMatchKind.Ambiguous: {
      return Concept2MatchResult.Ambiguous(match.candidates);
    }
    case SlotMatchKind.Unmatched: {
      return Concept2MatchResult.NotMatched();
    }
  }
};
