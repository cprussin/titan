import { getAthleteState } from "@titan/db/athlete-state";
import type { Db } from "@titan/db/client";
import { listCompletedWorkoutDates } from "@titan/db/workout-sessions";
import { athleteAbsoluteWeek } from "./athlete-absolute-week";

/** Where the athlete stands today: the program version they are on and the
 *  absolute training week their history puts them in. */
export type AthletePosition = {
  absoluteWeek: number;
  programVersionId: string;
};

/** Read the athlete's position, or `undefined` when no program is placed. */
export const athletePosition = async (
  db: Db,
  userId: string,
  today: string,
): Promise<AthletePosition | undefined> => {
  const [state, completedDates] = await Promise.all([
    getAthleteState(db, userId),
    listCompletedWorkoutDates(db, userId),
  ]);
  return state === undefined
    ? undefined
    : {
        absoluteWeek: athleteAbsoluteWeek(state, completedDates, today, today),
        programVersionId: state.programVersionId,
      };
};
