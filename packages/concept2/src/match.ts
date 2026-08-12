import type { NormalizedWorkout } from "@titan/domain/external";
import type {
  IntervalsPrescription,
  Prescription,
} from "@titan/domain/prescription";
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
 * Both gate on a one-day window that absorbs the timezone skew between
 * Concept2's local workout date and the UTC day the app schedules sessions on
 * (see `date.ts`) — an offset that can never exceed a single calendar day — and
 * both rank by how close the piece came to a target, measured as a
 * dimensionless fraction of that target ({@link cardioMismatch}) so a
 * distance-based effort and a time-based one compare on one scale. "No planned
 * work" is an ordinary outcome, not a failure, so it is modelled as a
 * {@link MatchResult} variant / `undefined` the caller branches on rather than a
 * thrown error (see ERRORS.md).
 */

const CARDIO_PRESCRIPTION_TYPES = new Set<Prescription["type"]>([
  "distance-cardio",
  "intervals",
  "timed-cardio",
]);

/** Timezone offsets top out near ±14 h, so the athlete's local logbook day and
 *  the UTC day the app scheduled the session on differ by at most one calendar
 *  day; matching tolerates exactly that drift. */
const MATCH_DAY_TOLERANCE = 1;

/** The most a live piece may deviate from a slot's target and still be taken as
 *  that slot's effort — half the target. It keeps a 10k slot from claiming a
 *  short warm-up (a 500 m row is 95% shy of 10k) while still accepting an effort
 *  the athlete cut or overshot by a sensible margin. */
const MAX_SLOT_MISMATCH = 0.5;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
  const scored = candidateSessions
    .map((session) => ({
      dayDelta: dayDifference(session.scheduledDate, day),
      mismatch: sessionMismatch(session, normalized),
      session,
    }))
    .filter(
      (candidate) =>
        candidate.dayDelta <= MATCH_DAY_TOLERANCE &&
        candidate.mismatch !== Number.POSITIVE_INFINITY,
    );
  const best = pickClosest(scored);
  return best === undefined
    ? MatchResult.Unmatched()
    : MatchResult.Matched(best.session.id);
};

/**
 * The imported row that best fits `prescription` scheduled on `scheduledDate`,
 * among `candidates` performed within the match window — or `undefined` when
 * none comes close enough. Ranks by day proximity then how near the piece landed
 * to the slot's target, so the slot claims its own effort rather than the first
 * row that shares its day.
 */
export const matchSlot = (
  prescription: Prescription,
  scheduledDate: string,
  candidates: readonly NormalizedWorkout[],
): NormalizedWorkout | undefined => {
  const scored = candidates
    .map((normalized) => ({
      dayDelta: dayDifference(scheduledDate, dayOf(normalized)),
      mismatch: cardioMismatch(prescription, normalized),
      normalized,
    }))
    .filter(
      (candidate) =>
        candidate.dayDelta <= MATCH_DAY_TOLERANCE &&
        candidate.mismatch <= MAX_SLOT_MISMATCH,
    );
  return pickClosest(scored)?.normalized;
};

type Scored = { dayDelta: number; mismatch: number };

const pickClosest = <T extends Scored>(scored: readonly T[]): T | undefined =>
  scored.reduce<T | undefined>(
    (best, current) =>
      best === undefined || isCloser(current, best) ? current : best,
    undefined,
  );

/** Day proximity is the primary signal — an equal-day tie falls through to the
 *  closest target. */
const isCloser = (current: Scored, best: Scored): boolean =>
  current.dayDelta < best.dayDelta ||
  (current.dayDelta === best.dayDelta && current.mismatch < best.mismatch);

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

/** Intervals target either a total distance or a total time (the constructor
 *  sets exactly one), so the piece is compared on whichever axis was set. */
const intervalsMismatch = (
  prescription: IntervalsPrescription,
  normalized: NormalizedWorkout,
): number => {
  if (prescription.workDistanceMeters !== undefined) {
    return relativeDelta(
      prescription.workDistanceMeters * prescription.count,
      normalized.summary.distanceMeters,
    );
  } else if (prescription.workSec === undefined) {
    return Number.POSITIVE_INFINITY;
  } else {
    return relativeDelta(
      prescription.workSec * prescription.count,
      normalized.summary.durationSec,
    );
  }
};

const relativeDelta = (target: number, actual: number | undefined): number =>
  actual === undefined
    ? Number.POSITIVE_INFINITY
    : Math.abs(target - actual) / target;

const dayOf = (normalized: NormalizedWorkout): string =>
  normalized.workoutAt.slice(0, 10);

const dayDifference = (a: string, b: string): number =>
  Math.abs(
    new Date(`${a}T00:00:00.000Z`).getTime() -
      new Date(`${b}T00:00:00.000Z`).getTime(),
  ) / MS_PER_DAY;
