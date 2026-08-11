import type { NormalizedWorkout } from "@titan/domain/external";
import type { Prescription } from "@titan/domain/prescription";
import type { WorkoutSession } from "@titan/domain/workout-session";

/**
 * Match an imported {@link NormalizedWorkout} to the planned rowing/cardio
 * session it belongs to. A candidate qualifies when it prescribes a cardio
 * effort and is scheduled within a calendar day of when the workout was
 * performed; among those, the nearest scheduled day wins, and equal days are
 * broken by whichever target distance is closest to the workout's. The
 * one-day window absorbs the timezone skew between Concept2's local workout
 * date and the UTC day the app schedules sessions on (see `date.ts`) — an
 * offset that can never exceed a single calendar day. The "no planned session"
 * case is an ordinary outcome, not a failure, so it is modelled as a
 * {@link MatchResult} variant the caller branches on rather than a thrown error
 * (see ERRORS.md).
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
  const day = normalized.workoutAt.slice(0, 10);
  const nearby = candidateSessions.filter(
    (session) =>
      isCardioSession(session) &&
      dayDifference(session.scheduledDate, day) <= MATCH_DAY_TOLERANCE,
  );
  const best = pickClosest(normalized, day, nearby);
  return best === undefined
    ? MatchResult.Unmatched()
    : MatchResult.Matched(best.id);
};

type ScoredSession = {
  dayDelta: number;
  distanceDelta: number;
  session: WorkoutSession;
};

const pickClosest = (
  normalized: NormalizedWorkout,
  day: string,
  sessions: readonly WorkoutSession[],
): WorkoutSession | undefined => {
  const workoutMeters = normalized.summary.distanceMeters ?? 0;
  const scored: ScoredSession[] = sessions.map((session) => ({
    dayDelta: dayDifference(session.scheduledDate, day),
    distanceDelta: distanceScore(session, workoutMeters),
    session,
  }));
  return scored.reduce<ScoredSession | undefined>(
    (best, current) =>
      best === undefined || isCloser(current, best) ? current : best,
    undefined,
  )?.session;
};

/** Day proximity is the primary signal — an equal-day tie falls through to the
 *  closest target distance. */
const isCloser = (current: ScoredSession, best: ScoredSession): boolean =>
  current.dayDelta < best.dayDelta ||
  (current.dayDelta === best.dayDelta &&
    current.distanceDelta < best.distanceDelta);

const dayDifference = (a: string, b: string): number =>
  Math.abs(
    new Date(`${a}T00:00:00.000Z`).getTime() -
      new Date(`${b}T00:00:00.000Z`).getTime(),
  ) / MS_PER_DAY;

const distanceScore = (
  session: WorkoutSession,
  workoutMeters: number,
): number => {
  const target = sessionTargetMeters(session);
  return target === undefined
    ? Number.POSITIVE_INFINITY
    : Math.abs(target - workoutMeters);
};

const isCardioSession = (session: WorkoutSession): boolean =>
  session.prescribedExercises.some((exercise) =>
    CARDIO_PRESCRIPTION_TYPES.has(exercise.prescription.type),
  );

const sessionTargetMeters = (session: WorkoutSession): number | undefined => {
  const cardio = session.prescribedExercises
    .map((exercise) => exercise.prescription)
    .find((prescription) => CARDIO_PRESCRIPTION_TYPES.has(prescription.type));
  return cardio === undefined ? undefined : prescriptionMeters(cardio);
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
