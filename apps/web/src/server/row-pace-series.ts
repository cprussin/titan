import type { ExternalWorkout } from "@titan/domain/external";
import type { WorkoutSession } from "@titan/domain/workout-session";

/** The rowing-pace trend: 500m splits oldest-first (for a left-to-right
 *  sparkline) and the latest split, in seconds per 500m. */
export type RowPaceSeries = {
  latestSplitSec: number;
  values: readonly number[];
};

/** A dated split point, before ordering. */
type PacePoint = { date: string; split: number };

/**
 * The 500m-split trend across logged rows — both completed in-app cardio pieces
 * and synced external (Concept2) workouts — ordered oldest to newest. Pure;
 * `undefined` when no split has been recorded yet.
 */
export const rowPaceSeries = (
  sessions: readonly WorkoutSession[],
  externals: readonly ExternalWorkout[],
): RowPaceSeries | undefined => {
  const points = [
    ...sessionPoints(sessions),
    ...externalPoints(externals),
  ].sort((a, b) => (a.date < b.date ? -1 : 1));
  const values = points.map((point) => point.split);
  const latest = values.at(-1);
  return latest === undefined ? undefined : { latestSplitSec: latest, values };
};

/** Split points from completed sessions' cardio results. */
const sessionPoints = (
  sessions: readonly WorkoutSession[],
): readonly PacePoint[] =>
  sessions
    .filter((session) => session.status === "completed")
    .flatMap((session) =>
      session.results.flatMap((result) =>
        result.cardio?.splitSecPer500 === undefined
          ? []
          : [
              {
                date: session.scheduledDate,
                split: result.cardio.splitSecPer500,
              },
            ],
      ),
    );

/** Split points from synced external workouts. */
const externalPoints = (
  externals: readonly ExternalWorkout[],
): readonly PacePoint[] =>
  externals.flatMap((workout) =>
    workout.normalized.summary.splitSecPer500 === undefined
      ? []
      : [
          {
            date: workout.normalized.workoutAt.slice(0, 10),
            split: workout.normalized.summary.splitSecPer500,
          },
        ],
  );
