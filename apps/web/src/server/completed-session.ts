import type { WorkoutSession } from "@titan/domain/workout-session";

/**
 * The workout the athlete has already finished for `date`: a completed session
 * scheduled for that day. `undefined` means today's workout is still open — not
 * yet started, or in progress — so there is an action left to offer.
 */
export const findCompletedSession = (
  sessions: readonly WorkoutSession[],
  date: string,
): WorkoutSession | undefined =>
  sessions.find(
    (session) =>
      session.status === "completed" && session.scheduledDate === date,
  );
