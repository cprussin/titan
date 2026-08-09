import type { AthleteState } from "./athlete-state";

/**
 * The athlete placement to write when bringing the database up to date, or
 * `undefined` when none is needed. An athlete who already has state is never
 * touched — re-running the sync on every server start must not rewind their
 * progress — and with no program to start there is nothing to place.
 */
export const initialAthleteState = (
  existing: AthleteState | undefined,
  firstProgramVersionId: string | undefined,
  userId: string,
  now: string,
): AthleteState | undefined => {
  if (existing !== undefined || firstProgramVersionId === undefined) {
    return undefined;
  } else {
    return {
      absoluteWeek: 1,
      programVersionId: firstProgramVersionId,
      updatedAt: now,
      userId,
    };
  }
};
