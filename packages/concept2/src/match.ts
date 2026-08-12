import type { NormalizedWorkout } from "@titan/domain/external";
import type { Prescription } from "@titan/domain/prescription";
import type {
  PrescribedExercise,
  WorkoutSession,
} from "@titan/domain/workout-session";

/**
 * Match an imported {@link NormalizedWorkout} to the exact planned cardio
 * exercise it belongs to. Every cardio effort across the candidate sessions is
 * a candidate slot; a slot qualifies when its session is scheduled within a
 * calendar day of when the workout was performed. Among those, the nearest
 * scheduled day wins, and equal days are broken by whichever slot's target
 * distance is closest to the workout's — so a session that prescribes both a
 * 10k piece and a short cooldown row binds each imported effort to the right
 * slot rather than to whichever cardio exercise came first. The one-day window
 * absorbs the timezone skew between Concept2's local workout date and the UTC
 * day the app schedules sessions on (see `date.ts`) — an offset that can never
 * exceed a single calendar day. The "no planned session" case is an ordinary
 * outcome, not a failure, so it is modelled as a {@link MatchResult} variant
 * the caller branches on rather than a thrown error (see ERRORS.md).
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

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export enum MatchKind {
  Matched,
  Unmatched,
}

export const MatchResult = {
  Matched: (workoutSessionId: string, slotId: string) => ({
    kind: MatchKind.Matched as const,
    slotId,
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
  const day = normalized.workoutAt.slice(0, 10);
  const nearby = cardioSlots(candidateSessions).filter(
    (slot) =>
      dayDifference(slot.session.scheduledDate, day) <= MATCH_DAY_TOLERANCE,
  );
  const best = pickClosest(normalized, day, nearby);
  return best === undefined
    ? MatchResult.Unmatched()
    : MatchResult.Matched(best.slot.session.id, best.slot.exercise.slotId);
};

/** One prescribed cardio effort, kept with its owning session so a match can
 *  name both the session and the exact slot the import belongs to. */
type CardioSlot = {
  session: WorkoutSession;
  exercise: PrescribedExercise;
};

type ScoredSlot = {
  dayDelta: number;
  distanceDelta: number;
  slot: CardioSlot;
};

const cardioSlots = (
  sessions: readonly WorkoutSession[],
): readonly CardioSlot[] =>
  sessions.flatMap((session) =>
    session.prescribedExercises
      .filter((exercise) =>
        CARDIO_PRESCRIPTION_TYPES.has(exercise.prescription.type),
      )
      .map((exercise) => ({ exercise, session })),
  );

const pickClosest = (
  normalized: NormalizedWorkout,
  day: string,
  slots: readonly CardioSlot[],
): ScoredSlot | undefined => {
  const workoutMeters = normalized.summary.distanceMeters ?? 0;
  const scored: ScoredSlot[] = slots.map((slot) => ({
    dayDelta: dayDifference(slot.session.scheduledDate, day),
    distanceDelta: distanceScore(slot.exercise, workoutMeters),
    slot,
  }));
  return scored.reduce<ScoredSlot | undefined>(
    (best, current) =>
      best === undefined || isCloser(current, best) ? current : best,
    undefined,
  );
};

/** Day proximity is the primary signal — an equal-day tie falls through to the
 *  closest target distance. */
const isCloser = (current: ScoredSlot, best: ScoredSlot): boolean =>
  current.dayDelta < best.dayDelta ||
  (current.dayDelta === best.dayDelta &&
    current.distanceDelta < best.distanceDelta);

const dayDifference = (a: string, b: string): number =>
  Math.abs(
    new Date(`${a}T00:00:00.000Z`).getTime() -
      new Date(`${b}T00:00:00.000Z`).getTime(),
  ) / MS_PER_DAY;

const distanceScore = (
  exercise: PrescribedExercise,
  workoutMeters: number,
): number => {
  const target = prescriptionMeters(exercise.prescription);
  return target === undefined
    ? Number.POSITIVE_INFINITY
    : Math.abs(target - workoutMeters);
};

const prescriptionMeters = (prescription: Prescription): number | undefined => {
  switch (prescription.type) {
    case "distance-cardio": {
      return prescription.distanceMeters;
    }
    case "intervals": {
      return prescription.workDistanceMeters === undefined
        ? undefined
        : prescription.workDistanceMeters * prescription.count;
    }
    case "bodyweight":
    case "circuit":
    case "strength":
    case "timed-cardio":
    case "timed-hold": {
      return undefined;
    }
  }
};
