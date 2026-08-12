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
 * Sync Concept2 and report whether any imported workout matches the cardio slot
 * the athlete is logging, identified by the session `id` and the `slotId` in the
 * request body. The import matches every fetched result to its exact planned
 * slot (the same path the manual sync uses); this handler picks out the one
 * assigned to the slot being executed, so a row already logged — or one finished
 * mid-workout, surfaced on a later poll — can be recorded automatically without
 * a multi-piece session handing the wrong row to the wrong step.
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
    if (connection === undefined) {
      return NextResponse.json({ error: "not connected" }, { status: 400 });
    } else if (session === undefined) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    } else {
      const outcomes = await importConcept2Results(
        connection,
        env.CONCEPT2_CLIENT_ID,
        env.CONCEPT2_CLIENT_SECRET,
      );
      const match = outcomes.find(
        (outcome) =>
          outcome.workout.matchedWorkoutSessionId === id &&
          outcome.workout.matchedSlotId === slotId,
      );
      return NextResponse.json(
        match === undefined
          ? Concept2MatchResult.NotMatched()
          : Concept2MatchResult.Matched(match.workout.normalized),
      );
    }
  }
};
