import type { Db } from "@titan/db/client";
import { listWorkoutSessions } from "@titan/db/workout-sessions";
import { resolveToday } from "./today";
import type { WorkoutAction } from "./workout-action";
import { resolveWorkoutAction } from "./workout-action";

/** Load the single workout action the app chrome should offer for `date`:
 *  today's resolution plus recent sessions, reduced by
 *  {@link resolveWorkoutAction}. */
export const currentWorkoutAction = async (
  db: Db,
  userId: string,
  date: string,
): Promise<WorkoutAction | undefined> => {
  const [today, sessions] = await Promise.all([
    resolveToday(db, userId, date),
    listWorkoutSessions(db, userId, 50),
  ]);
  return resolveWorkoutAction(today, sessions, date);
};
