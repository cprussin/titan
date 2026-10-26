import { listAdaptationDecisionsBySession } from "@titan/db/adaptation-decisions";
import { getAthleteState } from "@titan/db/athlete-state";
import { listBodyMetrics } from "@titan/db/body-metrics";
import type { Db } from "@titan/db/client";
import { listExternalWorkouts } from "@titan/db/external-workouts";
import { getProgramVersion, listPrograms } from "@titan/db/program-versions";
import {
  getWorkoutSessionByDate,
  listCompletedWorkoutDates,
  listWorkoutSessions,
} from "@titan/db/workout-sessions";
import type { DashboardData } from "../components/DashboardContent";
import { programName } from "../program-name";
import { athleteAbsoluteWeek } from "./athlete-absolute-week";
import type { DashboardProgram } from "./dashboard-view";
import { dashboardView } from "./dashboard-view";
import { exerciseNames } from "./exercise-names";
import { loggedSessionView } from "./logged-session-view";
import { buildSlotHistory, historyLookup } from "./slot-history";
import type { Today } from "./today";
import { resolveScheduledDay } from "./today";
import { trendsSummary } from "./trends-summary";
import { dayLabel, offsetWeekStart, weekDates } from "./week-dates";
import { completedSessionsByDate, weekSchedule } from "./week-schedule";
import { resolveWorkoutAction } from "./workout-action";

/**
 * Everything the dashboard shows for `selectedDate`, with the week picker paged
 * `weekOffset` weeks off the current one. Shared by the dashboard page and the
 * Android app's `/api/v1/dashboard`, so both read one decision.
 */
export const loadDashboard = async (
  db: Db,
  userId: string,
  today: string,
  selectedDate: string,
  weekOffset: number,
): Promise<DashboardData> => {
  const [
    state,
    names,
    programs,
    sessions,
    metrics,
    externals,
    historyMap,
    completedDates,
  ] = await Promise.all([
    getAthleteState(db, userId),
    exerciseNames(db),
    listPrograms(db),
    listWorkoutSessions(db, userId, 100),
    listBodyMetrics(db, userId, 60),
    listExternalWorkouts(db, userId, 100),
    buildSlotHistory(db, userId),
    listCompletedWorkoutDates(db, userId),
  ]);

  const programVersion =
    state === undefined
      ? undefined
      : await getProgramVersion(db, state.programVersionId);
  const absoluteWeek = athleteAbsoluteWeek(
    state,
    completedDates,
    today,
    offsetWeekStart(today, weekOffset),
  );

  const selected = await resolveScheduledDay(
    db,
    userId,
    absoluteWeek,
    selectedDate,
  );
  const loggedSession = await getWorkoutSessionByDate(db, userId, selectedDate);
  const logged =
    loggedSession === undefined || loggedSession.status !== "completed"
      ? undefined
      : loggedSessionView(
          loggedSession,
          names,
          (await listAdaptationDecisionsBySession(db, loggedSession.id)).map(
            (decision) => decision.explanation,
          ),
        );

  const week = weekSchedule({
    absoluteWeek,
    historyBySlot: historyLookup(historyMap),
    loggedByDate: completedSessionsByDate(sessions),
    names,
    programVersion,
    today,
    weekDates: weekDates(today, weekOffset),
  });

  const view = dashboardView({
    action: resolveWorkoutAction(selected, sessions, selectedDate),
    date: selectedDate,
    isFuture: selectedDate > today,
    isToday: selectedDate === today,
    logged,
    program: selectedProgram(selected, programs),
    selected,
    weekCount: weekCount(selected),
    weekLabel: dayLabel(selectedDate),
  });

  const summary = trendsSummary(metrics, sessions, externals);

  return {
    body: view.body,
    header: {
      eyebrow: view.eyebrow,
      primary: view.primary,
      title: view.title,
    },
    names,
    session: view.session,
    trends: {
      bodyWeight: {
        dates: summary.weightDates,
        latestWeightLb: summary.latestWeightLb,
        series: summary.weightSeries,
      },
      names,
      rowPace: summary.rowPace,
      strengthSeries: summary.strengthSeries,
    },
    week: { days: week, selectedDate, today, weekOffset },
  };
};

/** The selected day's program and block, when a program is placed — the eyebrow
 *  names the program and links to that block. */
const selectedProgram = (
  selected: Today,
  programs: Parameters<typeof programName>[0],
): DashboardProgram | undefined =>
  selected.kind === "workout"
    ? {
        blockId: selected.position.block.id,
        name: programName(programs, selected.programVersion.programId),
        versionId: selected.programVersion.id,
      }
    : undefined;

/** "W3 / 8" — the selected day's week within its block. */
const weekCount = (selected: Today): string | undefined =>
  selected.kind === "workout"
    ? `W${selected.position.weekInBlock} / ${selected.position.block.durationWeeks}`
    : undefined;
