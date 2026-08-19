import type { ExerciseResult } from "@titan/domain/result";
import type { WorkoutSession } from "@titan/domain/workout-session";
import { recordWorkoutResults } from "./record-workout-results";

/**
 * The session document as it stands once the last exercise is in: its final
 * results recorded and the session closed at `completedAt`. Building it is
 * separate from {@link completeWorkout}, which claims the session with the write
 * and runs everything that follows from it (personal records, the week advance).
 */
export const finishWorkoutSession = (
  session: WorkoutSession,
  recorded: ExerciseResult,
  completedAt: string,
): WorkoutSession => ({
  ...recordWorkoutResults(session, recorded, completedAt),
  completedAt,
  status: "completed",
});
