import { estimateOneRepMax } from "@titan/domain/one-rep-max";
import type { ExerciseResult } from "@titan/domain/result";
import type { WorkoutSession } from "@titan/domain/workout-session";

export type StrengthSeries = {
  exerciseId: string;
  values: readonly number[];
};

/**
 * The estimated-1RM trend for the exercise with the most logged weighted
 * sessions — one rounded point per session that recorded it, chronological.
 * Returns `undefined` when no weighted work exists yet.
 */
export const topStrengthSeries = (
  sessions: readonly WorkoutSession[],
): StrengthSeries | undefined => {
  const ordered = [...sessions].sort((a, b) =>
    a.scheduledDate < b.scheduledDate ? -1 : 1,
  );
  const byExercise = new Map<string, number[]>();
  for (const session of ordered) {
    for (const result of session.results) {
      const best = bestOneRepMax(result);
      if (best !== undefined) {
        const series = byExercise.get(result.exerciseId) ?? [];
        series.push(Math.round(best));
        byExercise.set(result.exerciseId, series);
      }
    }
  }
  return pickLongest(byExercise);
};

const bestOneRepMax = (result: ExerciseResult): number | undefined => {
  const estimates = result.sets
    .filter(
      (set) =>
        set.completed &&
        set.reps !== undefined &&
        set.reps > 0 &&
        set.weightLb !== undefined &&
        set.weightLb > 0,
    )
    .map((set) => estimateOneRepMax(set.weightLb ?? 0, set.reps ?? 1));
  return estimates.length === 0 ? undefined : Math.max(...estimates);
};

const pickLongest = (
  byExercise: ReadonlyMap<string, readonly number[]>,
): StrengthSeries | undefined =>
  [...byExercise.entries()].reduce<StrengthSeries | undefined>(
    (best, [exerciseId, values]) =>
      best === undefined || values.length > best.values.length
        ? { exerciseId, values }
        : best,
    undefined,
  );
