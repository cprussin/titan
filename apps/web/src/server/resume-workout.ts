import type { ExerciseResult, SetResult } from "@titan/domain/result";
import type { WorkoutSession } from "@titan/domain/workout-session";

/** Where the execution screen picks a session back up: the exercise to show,
 *  the results already recorded, and the sets logged against the exercise the
 *  athlete is partway through. */
export type ResumePoint = {
  index: number;
  logged: readonly SetResult[];
  results: readonly ExerciseResult[];
};

/**
 * Resolve where a session stands from what has been persisted, so a reload or a
 * second device carries on where the athlete left off. Exercises are recorded in
 * prescribed order, so the count of results is the position to resume at. The
 * in-progress sets name the slot they were logged against: they belong to the
 * exercise underway, and a record left behind by an exercise since recorded is
 * superseded by that result.
 */
export const resumeWorkout = (session: WorkoutSession): ResumePoint => {
  const index = session.results.length;
  const { inProgress } = session;
  return {
    index,
    logged:
      inProgress !== undefined &&
      inProgress.slotId === session.prescribedExercises[index]?.slotId
        ? inProgress.sets
        : [],
    results: session.results,
  };
};
