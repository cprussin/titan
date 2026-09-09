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
 * the day it was rowed. Within the day both rank by how close the piece came to
 * a target, measured as a dimensionless fraction of that target
 * ({@link cardioMismatch}) so a distance-based effort and a time-based one
 * compare on one scale — and an interval prescription is judged on the *shape*
 * of the piece, not just its total, so a continuous 2 km never passes for
 * 6 × 500 m. "No planned work" is an ordinary outcome, not a failure, so it is
 * modelled as a {@link MatchResult} variant / `undefined` the caller branches on
 * rather than a thrown error (see ERRORS.md).
 */

const CARDIO_PRESCRIPTION_TYPES = new Set<Prescription["type"]>([
  "distance-cardio",
  "intervals",
  "timed-cardio",
]);

/** The most a piece may deviate from a target — on total volume, and on each
 *  interval of an interval piece — and still be taken as that target's effort.
 *  The erg is programmed to the prescription, so the athlete's own piece lands
 *  within a few percent; a tenth leaves room for one trimmed or overshot by a
 *  sensible margin without letting a neighbouring piece claim the work. */
const MAX_MISMATCH = 0.1;

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
  const best = pickClosest(
    candidateSessions
      .filter((session) => session.scheduledDate === day)
      .map((session) => ({
        mismatch: sessionMismatch(session, normalized),
        session,
      }))
      .filter((candidate) => candidate.mismatch <= MAX_MISMATCH),
  );
  return best === undefined
    ? MatchResult.Unmatched()
    : MatchResult.Matched(best.session.id);
};

/**
 * The imported row that best fits `prescription` scheduled on `scheduledDate`,
 * among `candidates` rowed that day — or `undefined` when none comes close
 * enough. Ranks by how near the piece landed to the slot's target, so the slot
 * claims its own effort rather than the first row that shares its day.
 */
export const matchSlot = (
  prescription: Prescription,
  scheduledDate: string,
  candidates: readonly NormalizedWorkout[],
): NormalizedWorkout | undefined =>
  pickClosest(
    candidates
      .filter((normalized) => dayOf(normalized) === scheduledDate)
      .map((normalized) => ({
        mismatch: cardioMismatch(prescription, normalized),
        normalized,
      }))
      .filter((candidate) => candidate.mismatch <= MAX_MISMATCH),
  )?.normalized;

type Scored = { mismatch: number };

const pickClosest = <T extends Scored>(scored: readonly T[]): T | undefined =>
  scored.reduce<T | undefined>(
    (best, current) =>
      best === undefined || current.mismatch < best.mismatch ? current : best,
    undefined,
  );

/** A session's mismatch is that of its best-fitting cardio slot;
 *  `POSITIVE_INFINITY` when it prescribes no cardio at all, which drops it as a
 *  candidate. */
const sessionMismatch = (
  session: WorkoutSession,
  normalized: NormalizedWorkout,
): number =>
  Math.min(
    ...session.prescribedExercises
      .filter((exercise) =>
        CARDIO_PRESCRIPTION_TYPES.has(exercise.prescription.type),
      )
      .map((exercise) => cardioMismatch(exercise.prescription, normalized)),
    Number.POSITIVE_INFINITY,
  );

/** How far an imported piece fell from a prescription's target, as a
 *  dimensionless fraction of that target; `POSITIVE_INFINITY` when the
 *  prescription carries no target the piece can be compared against. */
const cardioMismatch = (
  prescription: Prescription,
  normalized: NormalizedWorkout,
): number => {
  switch (prescription.type) {
    case "distance-cardio": {
      return relativeDelta(
        prescription.distanceMeters,
        normalized.summary.distanceMeters,
      );
    }
    case "intervals": {
      return intervalsMismatch(prescription, normalized);
    }
    case "timed-cardio": {
      return relativeDelta(
        prescription.durationSec,
        normalized.summary.durationSec,
      );
    }
    case "bodyweight":
    case "circuit":
    case "strength":
    case "timed-hold": {
      return Number.POSITIVE_INFINITY;
    }
  }
};

/** An interval piece is the prescription's effort only when it was *rowed* as
 *  intervals: the erg must have recorded the prescribed number of them, each
 *  near the prescribed size. Judging it on total volume alone lets a continuous
 *  2 km warm-up — or a 3 × 1000 m — pass for 6 × 500 m. The worst interval sets
 *  the mismatch, so one effort nothing like the target disqualifies the piece. */
const intervalsMismatch = (
  prescription: IntervalsPrescription,
  normalized: NormalizedWorkout,
): number =>
  normalized.intervals.length === prescription.count
    ? Math.max(
        ...normalized.intervals.map((interval) =>
          intervalMismatch(prescription, interval),
        ),
      )
    : Number.POSITIVE_INFINITY;

/** Intervals target either a distance or a time per effort (the constructor
 *  sets exactly one), so the interval is compared on whichever axis was set. */
const intervalMismatch = (
  prescription: IntervalsPrescription,
  interval: IntervalResult,
): number => {
  if (prescription.workDistanceMeters !== undefined) {
    return relativeDelta(
      prescription.workDistanceMeters,
      interval.distanceMeters,
    );
  } else if (prescription.workSec === undefined) {
    return Number.POSITIVE_INFINITY;
  } else {
    return relativeDelta(prescription.workSec, interval.durationSec);
  }
};

const relativeDelta = (target: number, actual: number | undefined): number =>
  actual === undefined
    ? Number.POSITIVE_INFINITY
    : Math.abs(target - actual) / target;

const dayOf = (normalized: NormalizedWorkout): string =>
  normalized.workoutAt.slice(0, 10);
