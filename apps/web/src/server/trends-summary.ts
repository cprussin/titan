import type { BodyMetric } from "@titan/domain/body-metric";
import type { ExternalWorkout } from "@titan/domain/external";
import type { WorkoutSession } from "@titan/domain/workout-session";
import type { RowPaceSeries } from "./row-pace-series";
import { rowPaceSeries } from "./row-pace-series";
import type { StrengthSeries } from "./strength-series";
import { topStrengthSeriesList } from "./strength-series";

/** How many strength lifts the trends band highlights alongside row pace and
 *  body weight. */
const STRENGTH_TREND_COUNT = 2;

/** The at-a-glance training and body trends the dashboard renders. */
export type TrendsSummary = {
  latestWeightLb: number | undefined;
  /** The `YYYY-MM-DD` day of each weigh-in, in step with `weightSeries`. */
  weightDates: readonly string[];
  /** Body weight oldest-first, ready to feed a left-to-right sparkline. */
  weightSeries: readonly number[];
  /** The most-trained lifts' est-1RM trends, for the trends band. */
  strengthSeries: readonly StrengthSeries[];
  /** The rowing 500m-split trend, or `undefined` when nothing has been rowed. */
  rowPace: RowPaceSeries | undefined;
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
  const oldestFirst = [...metrics].reverse();
  return {
    latestWeightLb: metrics.at(0)?.weightLb,
    rowPace: rowPaceSeries(completed, externals),
    strengthSeries: topStrengthSeriesList(completed, STRENGTH_TREND_COUNT),
    weightDates: oldestFirst.map((metric) => metric.date),
    weightSeries: oldestFirst.map((metric) => metric.weightLb),
  };
};
