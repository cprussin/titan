import { listAdaptationDecisionsBySession } from "@titan/db/adaptation-decisions";
import { getWorkoutSession } from "@titan/db/workout-sessions";
import { NextResponse } from "next/server";
import {
  DELETE as deleteHandler,
  PATCH as patchHandler,
} from "../../../../../app/api/workouts/[id]/route";
import { apiAuthGuard } from "../../../../../auth/session";
import { db } from "../../../../../db";
import { explanationsByExercise } from "../../../../../server/explanations-by-exercise";
import { loadExecutionContext } from "../../../../../server/load-execution-context";
import { USER_ID } from "../../../../../user";

/** A session with everything the execution screen needs to run it: exercise
 *  names and modalities, whether Concept2 is connected, and why each target is
 *  what it is. */
export const GET = async (
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> => {
  const guard = await apiAuthGuard();
  if (guard === undefined) {
    const { id } = await context.params;
    const [session, execution, decisions] = await Promise.all([
      getWorkoutSession(db, id),
      loadExecutionContext(db, USER_ID),
      listAdaptationDecisionsBySession(db, id),
    ]);
    return session === undefined
      ? NextResponse.json({ error: "not found" }, { status: 404 })
      : NextResponse.json({
          ...execution,
          explanations: explanationsByExercise(decisions),
          session,
        });
  } else {
    return guard;
  }
};

/** The Android app's versioned mount of the web routes (see DATA.md). */
export const PATCH = patchHandler;
export const DELETE = deleteHandler;
