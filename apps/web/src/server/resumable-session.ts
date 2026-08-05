import type { WorkoutSession } from "@titan/domain/workout-session";

/**
 * The workout the athlete can resume for `date`: an in-progress session
 * scheduled for that day. `undefined` means today's workout hasn't been started
 * (or was already finished), so the athlete starts fresh — and starting again
 * would create a duplicate.
 */
export const findResumableSession = (
  sessions: readonly WorkoutSession[],
  date: string,
): WorkoutSession | undefined =>
  sessions.find(
    (session) =>
      session.status === "in-progress" && session.scheduledDate === date,
  );
