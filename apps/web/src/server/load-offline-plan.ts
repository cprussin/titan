import { getAthleteState } from "@titan/db/athlete-state";
import type { Db } from "@titan/db/client";
import { getProgramVersion } from "@titan/db/program-versions";
import { listCompletedWorkoutDates } from "@titan/db/workout-sessions";
import { athleteAbsoluteWeek } from "./athlete-absolute-week";
import type { ExecutionContext } from "./load-execution-context";
import { loadExecutionContext } from "./load-execution-context";
import type { OfflinePlanDay } from "./offline-plan";
import { offlinePlan } from "./offline-plan";
import { buildSlotHistory, historyLookup } from "./slot-history";
import { addDays } from "./week-dates";

/** The Android app's offline cache of the days ahead, with the context the
 *  execution screen needs to run any of them. */
export type OfflinePlan = ExecutionContext & {
  days: readonly OfflinePlanDay[];
};

/** Resolve today and the `dayCount - 1` days after it from one set of reads.
 *  Without a placed program there is nothing to start. */
export const loadOfflinePlan = async (
  db: Db,
  userId: string,
  today: string,
  dayCount: number,
): Promise<OfflinePlan> => {
  const [state, completedDates, history, context] = await Promise.all([
    getAthleteState(db, userId),
    listCompletedWorkoutDates(db, userId),
    buildSlotHistory(db, userId),
    loadExecutionContext(db, userId),
  ]);
  const programVersion =
    state === undefined
      ? undefined
      : await getProgramVersion(db, state.programVersionId);
  return {
    ...context,
    days:
      programVersion === undefined
        ? []
        : offlinePlan({
            absoluteWeekFor: (date) =>
              athleteAbsoluteWeek(state, completedDates, today, date),
            dates: Array.from({ length: dayCount }, (_, index) =>
              addDays(today, index),
            ),
            historyBySlot: historyLookup(history),
            programVersion,
          }),
  };
};
