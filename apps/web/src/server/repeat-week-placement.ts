import type { AthleteState } from "@titan/db/athlete-state";
import type { ProgramVersion } from "@titan/domain/program";
import type { WorkoutSession } from "@titan/domain/workout-session";
import { blockStartWeek } from "./active-block";
import { offsetWeekStart } from "./week-dates";

/**
 * The placement to write when weekly adaptation says to repeat the week a
 * session belongs to: that same absolute week, placed in the calendar week after
 * it. The athlete's week is counted forward from their placement through the
 * weeks they trained, so re-placing them past the week they just trained is what
 * makes the coming week run it again instead of moving on.
 */
export const repeatWeekPlacement = (
  state: AthleteState,
  version: ProgramVersion,
  session: WorkoutSession,
  updatedAt: string,
): AthleteState => ({
  ...state,
  absoluteWeek:
    blockStartWeek(version, session.blockId) + session.weekNumber - 1,
  placedOn: offsetWeekStart(session.scheduledDate, 1),
  updatedAt,
});
