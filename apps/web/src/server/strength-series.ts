import type { LoadUnit } from "@titan/domain/load-unit";
import { estimateOneRepMax } from "@titan/domain/one-rep-max";
import type { ExerciseResult } from "@titan/domain/result";
import type { WorkoutSession } from "@titan/domain/workout-session";

export type StrengthSeries = {
  exerciseId: string;
  /** The unit every point is in (kg for a barbell lift, else lb). */
  unit: LoadUnit;
  values: readonly number[];
};

type Accumulated = { unit: LoadUnit; values: number[] };

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
  const byExercise = new Map<string, Accumulated>();
  for (const session of ordered) {
    for (const result of session.results) {
      const best = bestOneRepMax(result);
      if (best !== undefined) {
        const series = byExercise.get(result.exerciseId) ?? {
          unit: resultUnit(result),
          values: [],
        };
        series.values.push(Math.round(best));
        byExercise.set(result.exerciseId, series);
      }
    }
  }
  return pickLongest(byExercise);
};

/** The unit a result's loads were logged in — its snapshot prescription carries
 *  it for strength work; everything else is pounds. */
const resultUnit = (result: ExerciseResult): LoadUnit =>
  result.prescription.type === "strength" ? result.prescription.unit : "lb";

const bestOneRepMax = (result: ExerciseResult): number | undefined => {
  const estimates = result.sets
    .filter(
      (set) =>
        set.completed &&
        set.reps !== undefined &&
        set.reps > 0 &&
        set.weight !== undefined &&
        set.weight > 0,
    )
    .map((set) => estimateOneRepMax(set.weight ?? 0, set.reps ?? 1));
  return estimates.length === 0 ? undefined : Math.max(...estimates);
};

const pickLongest = (
  byExercise: ReadonlyMap<string, Accumulated>,
): StrengthSeries | undefined =>
  [...byExercise.entries()].reduce<StrengthSeries | undefined>(
    (best, [exerciseId, { unit, values }]) =>
      best === undefined || values.length > best.values.length
        ? { exerciseId, unit, values }
        : best,
    undefined,
  );
