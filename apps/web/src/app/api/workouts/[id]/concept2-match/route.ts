import { matchSlot } from "@titan/concept2/match";
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
 * the manual sync uses); this handler then picks the row nearest that slot's
 * target, so the slot claims its own effort — a 10k slot takes the 10k rather
 * than a 500 m warm-up that merely shares the day. A row already logged, or one
 * finished mid-workout and surfaced on a later poll, is recorded automatically.
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
      return NextResponse.json(
        match === undefined
          ? Concept2MatchResult.NotMatched()
          : Concept2MatchResult.Matched(match),
      );
    }
  }
};
