import { getAthleteState as defaultGetAthleteState } from "@titan/db/athlete-state";
import type { Db } from "@titan/db/client";
import { getProgramVersion as defaultGetProgramVersion } from "@titan/db/program-versions";
import { listWorkoutSessions as defaultListWorkoutSessions } from "@titan/db/workout-sessions";
import { exerciseNames as defaultExerciseNames } from "./exercise-names";
import {
  buildSlotHistory as defaultBuildSlotHistory,
  historyLookup,
} from "./slot-history";
import { weekDates } from "./week-dates";
import type { WeekDay } from "./week-day";
import { completedSessionsByDate, weekSchedule } from "./week-schedule";

/** How many recent sessions the ribbon scans for its logged-day markers. */
const SESSION_WINDOW = 100;

/**
 * Resolve one week of the dashboard ribbon at a given offset from the athlete's
 * current week. This gathers the DB rows a week needs and hands them to the pure
 * {@link weekSchedule}; the dashboard renders the current week from its own
 * batched reads, while the ribbon calls this per week as it lazy-loads the
 * neighbours. The db reads are injected so the gathering is unit-testable
 * (see TESTING.md).
 */
export const loadWeekSchedule = async (
  db: Db,
  userId: string,
  today: string,
  weekOffset: number,
  getAthleteState: typeof defaultGetAthleteState = defaultGetAthleteState,
  getProgramVersion: typeof defaultGetProgramVersion = defaultGetProgramVersion,
  listWorkoutSessions: typeof defaultListWorkoutSessions = defaultListWorkoutSessions,
  exerciseNames: typeof defaultExerciseNames = defaultExerciseNames,
  buildSlotHistory: typeof defaultBuildSlotHistory = defaultBuildSlotHistory,
): Promise<readonly WeekDay[]> => {
  const [state, names, sessions, historyMap] = await Promise.all([
    getAthleteState(db, userId),
    exerciseNames(db),
    listWorkoutSessions(db, userId, SESSION_WINDOW),
    buildSlotHistory(db, userId),
  ]);
  const programVersion =
    state === undefined
      ? undefined
      : await getProgramVersion(db, state.programVersionId);
  return weekSchedule({
    absoluteWeek: (state?.absoluteWeek ?? 1) + weekOffset,
    historyBySlot: historyLookup(historyMap),
    loggedByDate: completedSessionsByDate(sessions),
    names,
    programVersion,
    today,
    weekDates: weekDates(today, weekOffset),
  });
};
