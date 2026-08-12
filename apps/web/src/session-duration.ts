import type { ExerciseResult } from "@titan/domain/result";
import type { WorkoutSession } from "@titan/domain/workout-session";

/** Derives the duration to display for a completed session. Pure. */

const MS_PER_MIN = 60_000;
const MS_PER_SEC = 1000;

/**
 * How long a session took, in whole minutes.
 *
 * A cardio piece is always counted at its own logged duration (typed or synced
 * from Concept2), never at the wall-clock time the app happened to observe for
 * it — a row finished on the erg before the session was opened, and one rowed
 * with the app open, should read the same. So from the wall-clock span
 * (started → completed) we subtract the time the app spent on each cardio piece
 * and add that piece's logged duration back, leaving `non-cardio work + logged
 * cardio`.
 *
 * Telling those apart needs each piece's recorded position within the session;
 * results predating that fall back to the larger of the wall-clock span and the
 * total logged cardio, which still recovers a row whose wall-clock span
 * collapsed. A session that was never timed keeps the plan's estimate. Never
 * reports less than a minute for a measured session.
 */
export const sessionDurationMin = (session: WorkoutSession): number => {
  const { completedAt, estimatedDurationMin, results, startedAt } = session;
  const loggedCardioMs = totalLoggedCardioSec(results) * MS_PER_SEC;
  if (startedAt === undefined || completedAt === undefined) {
    return loggedCardioMs > 0
      ? Math.max(1, toMinutes(loggedCardioMs))
      : estimatedDurationMin;
  } else {
    const startMs = Date.parse(startedAt);
    const wallClockMs = Date.parse(completedAt) - startMs;
    const measuredCardioMs = measuredCardioSpanMs(results, startMs);
    return measuredCardioMs === undefined
      ? Math.max(1, toMinutes(wallClockMs), toMinutes(loggedCardioMs))
      : Math.max(1, toMinutes(wallClockMs - measuredCardioMs + loggedCardioMs));
  }
};

const toMinutes = (ms: number): number => Math.round(ms / MS_PER_MIN);

const totalLoggedCardioSec = (results: readonly ExerciseResult[]): number =>
  results.reduce((sum, result) => sum + (result.cardio?.durationSec ?? 0), 0);

/**
 * The wall-clock time the app spent on cardio pieces, summed. Each piece
 * occupies the span from the prior piece's recorded time (or the session start
 * for the first) to its own — so the value is defined only when every result
 * carries a recorded time; `undefined` signals a legacy session to the caller.
 */
const measuredCardioSpanMs = (
  results: readonly ExerciseResult[],
  startMs: number,
): number | undefined => {
  if (results.some((result) => result.recordedAt === undefined)) {
    return undefined;
  } else {
    return results.reduce((sum, result, index) => {
      const priorMs =
        index === 0 ? startMs : Date.parse(recordedAtOf(results[index - 1]));
      return (
        sum +
        (result.cardio === undefined
          ? 0
          : Date.parse(recordedAtOf(result)) - priorMs)
      );
    }, 0);
  }
};

/** The recorded time of a result the caller has already established carries one;
 *  its absence here is an invariant violation, not a display state. */
const recordedAtOf = (result: ExerciseResult | undefined): string => {
  if (result?.recordedAt === undefined) {
    throw new Error("expected every result to carry a recorded time");
  } else {
    return result.recordedAt;
  }
};
