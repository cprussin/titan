import type { AthleteState } from "@titan/db/athlete-state";
import type { CompletedWorkoutDate } from "@titan/db/workout-sessions";
import type { Placement } from "@titan/program-engine/absolute-week";
import { absoluteWeekFor } from "@titan/program-engine/absolute-week";

/**
 * The absolute training week the calendar week containing `targetDate` lands on,
 * for the athlete placed by `state`. Without a placement there is no program to
 * count through, and every caller renders the no-program state, so the program's
 * first week stands in.
 */
export const athleteAbsoluteWeek = (
  state: AthleteState | undefined,
  completed: readonly CompletedWorkoutDate[],
  today: string,
  targetDate: string,
): number => {
  if (state === undefined) {
    return 1;
  } else {
    const dates = trainedOn(completed, state.programVersionId);
    return absoluteWeekFor(
      placement(state, dates, today),
      dates,
      today,
      targetDate,
    );
  }
};

/** The days trained on `programVersionId`. Weeks trained on another program are
 *  no part of this one's progress. */
const trainedOn = (
  completed: readonly CompletedWorkoutDate[],
  programVersionId: string,
): readonly string[] =>
  completed
    .filter((day) => day.programVersionId === programVersionId)
    .map((day) => day.scheduledDate);

/**
 * The placement to count from. Rows written before placements recorded a date
 * carry a week that was advanced by hand on each completed week, which no longer
 * says which calendar week it belongs to; every such athlete was placed at the
 * program's first week, so they are anchored on the first week they trained.
 */
const placement = (
  state: AthleteState,
  trainedDates: readonly string[],
  today: string,
): Placement =>
  state.placedOn === undefined
    ? { absoluteWeek: 1, placedOn: trainedDates[0] ?? today }
    : { absoluteWeek: state.absoluteWeek, placedOn: state.placedOn };
