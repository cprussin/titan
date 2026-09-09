import type { NormalizedWorkout } from "@titan/domain/external";
import type {
  IntervalsPrescription,
  Prescription,
} from "@titan/domain/prescription";
import type { IntervalResult } from "@titan/domain/result";
import type { WorkoutSession } from "@titan/domain/workout-session";

/**
 * Match imported Concept2 rows to planned rowing/cardio work. There are two
 * directions:
 *
 * - {@link matchWorkout} answers "which planned session does this imported row
 *   belong to?" — the history/dedup view the background sync and webhook store.
 * - {@link matchSlot} answers "which imported row is *this* prescribed effort?"
 *   — what the live rowing step needs, so a 10k slot claims the athlete's 10k
 *   piece rather than a 500 m warm-up that merely landed on the same day.
 *
 * Both gate on the athlete's calendar day: Concept2 stamps the logbook in the
 * athlete's local time and a session's `scheduledDate` is that same local day
 * (see `date.ts`), so the two are on one calendar and a piece belongs only to
 * the day it was rowed.
 *
 * Within the day the test is **exact** ({@link isCardioMatch}), because the
 * prescription is what the athlete dials into the ergometer: a fixed-time piece
 * runs the prescribed clock to the tenth, a fixed-distance piece stops on the
 * prescribed metre, and an interval piece logs the prescribed number of work
 * intervals at the prescribed size. A piece that misses is not this effort
 * rowed loosely — it is a different piece, and there is no tolerance under
 * which admitting it beats leaving the slot for the athlete to log. Whatever
 * the prescription doesn't pin down (the distance a timed piece covers, the
 * split it was held at, the heart-rate zone it targeted) is not part of the
 * test.
 *
 * "No planned work" is an ordinary outcome, not a failure, so it is modelled as
 * a {@link MatchResult} variant / `undefined` the caller branches on rather than
 * a thrown error (see ERRORS.md).
 */

export enum MatchKind {
  Matched,
  Unmatched,
}

export const MatchResult = {
  Matched: (workoutSessionId: string) => ({
    kind: MatchKind.Matched as const,
    workoutSessionId,
  }),
  Unmatched: () => ({ kind: MatchKind.Unmatched as const }),
};

export type MatchResult = ReturnType<
  (typeof MatchResult)[keyof typeof MatchResult]
>;

export const matchWorkout = (
  normalized: NormalizedWorkout,
  candidateSessions: readonly WorkoutSession[],
): MatchResult => {
  const day = dayOf(normalized);
  const match = candidateSessions.find(
    (session) =>
      session.scheduledDate === day &&
      session.prescribedExercises.some((exercise) =>
        isCardioMatch(exercise.prescription, normalized),
      ),
  );
  return match === undefined
    ? MatchResult.Unmatched()
    : MatchResult.Matched(match.id);
};

/**
 * The imported row that is `prescription` scheduled on `scheduledDate`, among
 * `candidates` rowed that day — or `undefined` when none hits the target. When
 * the day holds more than one piece on the same prescription (a warm-up and a
 * cool-down rowed alike), the earliest is taken: the athlete works through the
 * session in order.
 */
export const matchSlot = (
  prescription: Prescription,
  scheduledDate: string,
  candidates: readonly NormalizedWorkout[],
): NormalizedWorkout | undefined =>
  earliest(
    candidates.filter(
      (normalized) =>
        dayOf(normalized) === scheduledDate &&
        isCardioMatch(prescription, normalized),
    ),
  );

const earliest = (
  candidates: readonly NormalizedWorkout[],
): NormalizedWorkout | undefined =>
  candidates.reduce<NormalizedWorkout | undefined>(
    (best, current) =>
      best === undefined || current.workoutAt < best.workoutAt ? current : best,
    undefined,
  );

/** Whether an imported piece is the effort `prescription` asked for. Only the
 *  axis the prescription pins down is tested, and it is tested exactly; a
 *  prescription with no cardio target is never a piece. */
const isCardioMatch = (
  prescription: Prescription,
  normalized: NormalizedWorkout,
): boolean => {
  switch (prescription.type) {
    case "distance-cardio": {
      return normalized.summary.distanceMeters === prescription.distanceMeters;
    }
    case "intervals": {
      return isIntervalsMatch(prescription, normalized);
    }
    case "timed-cardio": {
      return normalized.summary.durationSec === prescription.durationSec;
    }
    case "bodyweight":
    case "circuit":
    case "strength":
    case "timed-hold": {
      return false;
    }
  }
};

/** An interval piece is the prescription's effort only when it was *rowed* as
 *  those intervals: the erg recorded the prescribed number of work intervals,
 *  every one of them on target. A continuous row logs none at all, so it can
 *  never stand in for one however far it went. */
const isIntervalsMatch = (
  prescription: IntervalsPrescription,
  normalized: NormalizedWorkout,
): boolean =>
  normalized.intervals.length === prescription.count &&
  normalized.intervals.every((interval) =>
    isIntervalMatch(prescription, interval),
  );

/** Intervals target either a distance or a time per effort (the constructor
 *  sets exactly one), so the interval is tested on whichever axis was set. */
const isIntervalMatch = (
  prescription: IntervalsPrescription,
  interval: IntervalResult,
): boolean => {
  if (prescription.workDistanceMeters !== undefined) {
    return interval.distanceMeters === prescription.workDistanceMeters;
  } else if (prescription.workSec === undefined) {
    return false;
  } else {
    return interval.durationSec === prescription.workSec;
  }
};

const dayOf = (normalized: NormalizedWorkout): string =>
  normalized.workoutAt.slice(0, 10);
