import type { LoadUnit } from "@titan/domain/load-unit";
import { estimateOneRepMax } from "@titan/domain/one-rep-max";
import type { ExerciseResult } from "@titan/domain/result";
import type { WorkoutSession } from "@titan/domain/workout-session";

export type StrengthSeries = {
  /** The `YYYY-MM-DD` day each value was logged, in step with `values`. */
  dates: readonly string[];
  exerciseId: string;
  /** The unit every point is in (kg for a barbell lift, else lb). */
  unit: LoadUnit;
  values: readonly number[];
};

type Accumulated = { dates: string[]; unit: LoadUnit; values: number[] };

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
          dates: [],
          unit: resultUnit(result),
          values: [],
        };
        series.dates.push(session.scheduledDate);
        series.values.push(Math.round(best));
        byExercise.set(result.exerciseId, series);
      }
    }
  }
  return [...byExercise.entries()]
    .map(([exerciseId, { dates, unit, values }]) => ({
      dates,
      exerciseId,
      unit,
      values,
    }))
    .sort((a, b) => b.values.length - a.values.length)
    .slice(0, limit);
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
