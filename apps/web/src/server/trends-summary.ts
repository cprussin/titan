import type { BodyMetric } from "@titan/domain/body-metric";
import type { ExternalWorkout } from "@titan/domain/external";
import type { WorkoutSession } from "@titan/domain/workout-session";
import type { StrengthSeries } from "./strength-series";
import { topStrengthSeries } from "./strength-series";

/** The at-a-glance training and body trends the dashboard renders. */
export type TrendsSummary = {
  latestWeightLb: number | undefined;
  /** Signed change from the previous weigh-in to the latest, or `undefined`
   *  when fewer than two weigh-ins exist. */
  weightChangeLb: number | undefined;
  /** Body weight oldest-first, ready to feed a left-to-right sparkline. */
  weightSeries: readonly number[];
  totalSets: number;
  rowingMeters: number;
  strength: StrengthSeries | undefined;
};

/**
 * Derive the trend summary from raw history. `metrics` arrive newest-first (the
 * DB orders weigh-ins by date descending), so the charted series is reversed to
 * read oldest-first while the latest weight is taken from the head.
 */
export const trendsSummary = (
  metrics: readonly BodyMetric[],
  sessions: readonly WorkoutSession[],
  externals: readonly ExternalWorkout[],
): TrendsSummary => {
  const completed = sessions.filter(
    (session) => session.status === "completed",
  );
  const latest = metrics.at(0);
  const previous = metrics.at(1);
  return {
    latestWeightLb: latest?.weightLb,
    rowingMeters: externals.reduce(
      (meters, workout) =>
        meters + (workout.normalized.summary.distanceMeters ?? 0),
      0,
    ),
    strength: topStrengthSeries(completed),
    totalSets: completed.reduce(
      (count, session) =>
        count +
        session.results.reduce((sets, result) => sets + result.sets.length, 0),
      0,
    ),
    weightChangeLb:
      latest === undefined || previous === undefined
        ? undefined
        : latest.weightLb - previous.weightLb,
    weightSeries: [...metrics].reverse().map((metric) => metric.weightLb),
  };
};
