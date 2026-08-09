import { deleteAdaptationDecisionsByUser as defaultDeleteDecisions } from "@titan/db/adaptation-decisions";
import { deleteBodyMetricsByUser as defaultDeleteBodyMetrics } from "@titan/db/body-metrics";
import type { Db } from "@titan/db/client";
import { deleteWorkoutSessionsByUser as defaultDeleteSessions } from "@titan/db/workout-sessions";

/**
 * Wipe an athlete's logged history: every workout session together with the
 * adaptation decisions those sessions produced, plus every body-metric
 * weigh-in. Program configuration, athlete state, and personal records are
 * left intact — this clears the history log, not the athlete's setup. The db
 * writes are injected so the orchestration is unit-testable (see TESTING.md).
 */
export const deleteHistory = async (
  db: Db,
  userId: string,
  deleteWorkoutSessionsByUser: typeof defaultDeleteSessions = defaultDeleteSessions,
  deleteAdaptationDecisionsByUser: typeof defaultDeleteDecisions = defaultDeleteDecisions,
  deleteBodyMetricsByUser: typeof defaultDeleteBodyMetrics = defaultDeleteBodyMetrics,
): Promise<void> => {
  await Promise.all([
    deleteWorkoutSessionsByUser(db, userId),
    deleteAdaptationDecisionsByUser(db, userId),
    deleteBodyMetricsByUser(db, userId),
  ]);
};
