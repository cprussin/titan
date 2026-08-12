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
 * The estimated-1RM trends for the exercises with the most logged weighted
 * sessions — one rounded point per session that recorded it, chronological,
 * ordered from most-trained lift down and capped at `limit`. Empty when no
 * weighted work exists yet.
 */
export const topStrengthSeriesList = (
  sessions: readonly WorkoutSession[],
  limit: number,
): readonly StrengthSeries[] => {
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
  return [...byExercise.entries()]
    .map(([exerciseId, { unit, values }]) => ({ exerciseId, unit, values }))
    .sort((a, b) => b.values.length - a.values.length)
    .slice(0, limit);
};

/**
 * The estimated-1RM trend for the exercise with the most logged weighted
 * sessions, or `undefined` when no weighted work exists yet.
 */
export const topStrengthSeries = (
  sessions: readonly WorkoutSession[],
): StrengthSeries | undefined => topStrengthSeriesList(sessions, 1).at(0);

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
