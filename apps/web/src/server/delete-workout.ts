import { deleteAdaptationDecisionsBySession as defaultDeleteDecisions } from "@titan/db/adaptation-decisions";
import type { Db } from "@titan/db/client";
import { deleteWorkoutSession as defaultDeleteSession } from "@titan/db/workout-sessions";

/**
 * Permanently delete a single workout from history: the session together with
 * the adaptation decisions it produced. Unlike `cancelWorkout`, this makes no
 * status check — removing a logged workout is an explicit, confirmed action,
 * so it applies to completed sessions too. The db writes are injected so the
 * orchestration is unit-testable (see TESTING.md).
 */
export const deleteWorkout = async (
  db: Db,
  sessionId: string,
  deleteWorkoutSession: typeof defaultDeleteSession = defaultDeleteSession,
  deleteAdaptationDecisionsBySession: typeof defaultDeleteDecisions = defaultDeleteDecisions,
): Promise<void> => {
  await Promise.all([
    deleteWorkoutSession(db, sessionId),
    deleteAdaptationDecisionsBySession(db, sessionId),
  ]);
};
