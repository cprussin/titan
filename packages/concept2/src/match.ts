import type { NormalizedWorkout } from "@titan/domain/external";
import type { Prescription } from "@titan/domain/prescription";
import type { WorkoutSession } from "@titan/domain/workout-session";

/**
 * Match an imported {@link NormalizedWorkout} to the planned rowing/cardio
 * session it belongs to. A candidate qualifies when it is scheduled on the same
 * calendar day the workout was performed and prescribes a cardio effort; when
 * several qualify, the one whose target distance is closest to the workout's
 * distance wins. The "no planned session" case is an ordinary outcome, not a
 * failure, so it is modelled as a {@link MatchResult} variant the caller
 * branches on rather than a thrown error (see ERRORS.md).
 */

const CARDIO_PRESCRIPTION_TYPES = new Set<Prescription["type"]>([
  "distance-cardio",
  "intervals",
  "timed-cardio",
]);

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
  const sameDay = candidateSessions.filter(
    (session) => session.scheduledDate === day && isCardioSession(session),
  );
  const best = pickClosest(normalized, sameDay);
  return best === undefined
    ? MatchResult.Unmatched()
    : MatchResult.Matched(best.id);
};

const pickClosest = (
  normalized: NormalizedWorkout,
  sessions: readonly WorkoutSession[],
): WorkoutSession | undefined => {
  const workoutMeters = normalized.summary.distanceMeters ?? 0;
  const scored = sessions.map((session) => ({
    score: distanceScore(session, workoutMeters),
    session,
  }));
  return scored.reduce<(typeof scored)[number] | undefined>(
    (best, current) =>
      best === undefined || current.score < best.score ? current : best,
    undefined,
  )?.session;
};

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
