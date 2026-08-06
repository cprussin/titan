import { deleteAdaptationDecisionsBySession as defaultDeleteDecisions } from "@titan/db/adaptation-decisions";
import type { Db } from "@titan/db/client";
import {
  deleteWorkoutSession as defaultDeleteSession,
  getWorkoutSession as defaultGetSession,
} from "@titan/db/workout-sessions";

/**
 * Discard an in-progress workout: delete the session together with the
 * adaptation decisions that produced it, so the athlete returns to a clean
 * slate and can start today's workout again. Throws if the session is missing
 * or already finished — cancelling a completed session would destroy real
 * results. The db reads/writes are injected so the guard logic is unit-testable
 * (see TESTING.md).
 */
export const cancelWorkout = async (
  db: Db,
  sessionId: string,
  getWorkoutSession: typeof defaultGetSession = defaultGetSession,
  deleteWorkoutSession: typeof defaultDeleteSession = defaultDeleteSession,
  deleteAdaptationDecisionsBySession: typeof defaultDeleteDecisions = defaultDeleteDecisions,
): Promise<void> => {
  const session = await getWorkoutSession(db, sessionId);
  if (session === undefined) {
    throw new Error(`workout session ${sessionId} not found`);
  } else if (session.status === "in-progress") {
    await deleteAdaptationDecisionsBySession(db, sessionId);
    await deleteWorkoutSession(db, sessionId);
  } else {
    throw new Error(
      `workout session ${sessionId} is ${session.status}, not in progress`,
    );
  }
};
