import type { Db } from "@titan/db/client";
import { listWorkoutSessions } from "@titan/db/workout-sessions";
import type { ExerciseResult } from "@titan/domain/result";

/** How many recent sessions to scan when building progression history. */
const HISTORY_WINDOW = 200;

/**
 * Build the per-slot result history the program engine needs: for each slot,
 * the completed results in chronological order (oldest → newest). Slot ids are
 * stable across weeks, so a slot's history is exactly its prior results.
 */
export const buildSlotHistory = async (
  db: Db,
  userId: string,
): Promise<Map<string, ExerciseResult[]>> => {
  const sessions = await listWorkoutSessions(db, userId, HISTORY_WINDOW);
  const chronological = sessions
    .filter((session) => session.status === "completed")
    .sort((a, b) => (a.scheduledDate < b.scheduledDate ? -1 : 1));
  const history = new Map<string, ExerciseResult[]>();
  for (const session of chronological) {
    for (const result of session.results) {
      const existing = history.get(result.slotId) ?? [];
      existing.push(result);
      history.set(result.slotId, existing);
    }
  }
  return history;
};

/** Turn a history map into the `historyBySlot` lookup `resolveSession` expects. */
export const historyLookup =
  (history: Map<string, ExerciseResult[]>) =>
  (slotId: string): readonly ExerciseResult[] =>
    history.get(slotId) ?? [];
