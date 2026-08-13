import { listAdaptationDecisionsBySession } from "@titan/db/adaptation-decisions";
import { getAthleteState } from "@titan/db/athlete-state";
import { listBodyMetrics } from "@titan/db/body-metrics";
import { listExternalWorkouts } from "@titan/db/external-workouts";
import { getProgramVersion, listPrograms } from "@titan/db/program-versions";
import {
  getWorkoutSessionByDate,
  listWorkoutSessions,
} from "@titan/db/workout-sessions";
import type { Metadata } from "next";
import { z } from "zod";
import type { DashboardData } from "../../components/DashboardContent";
import { DashboardContent } from "../../components/DashboardContent";
import { db } from "../../db";
import { programName } from "../../program-name";
import { dashboardView } from "../../server/dashboard-view";
import { exerciseNames } from "../../server/exercise-names";
import { todayIso } from "../../server/local-date";
import { loggedSessionView } from "../../server/logged-session-view";
import { buildSlotHistory, historyLookup } from "../../server/slot-history";
import type { Today } from "../../server/today";
import { resolveScheduledDay } from "../../server/today";
import { trendsSummary } from "../../server/trends-summary";
import { dayLabel, weekDates } from "../../server/week-dates";
import {
  completedSessionsByDate,
  weekSchedule,
} from "../../server/week-schedule";
import { resolveWorkoutAction } from "../../server/workout-action";
import { USER_ID } from "../../user";

export const metadata: Metadata = {
  description: "Today's plan and your recent training trends at a glance.",
  title: "Dashboard",
};

/** `?date` selects a day; `?week` pages the picker off the current week. */
const dateParamSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const weekParamSchema = z.coerce.number().int();

const DashboardPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const today = await todayIso();
  const params = await searchParams;
  const weekOffset = selectWeek(params.week);
  const selectedDate = selectDate(params.date, today);

  const [state, names, programs, sessions, metrics, externals, historyMap] =
    await Promise.all([
      getAthleteState(db, USER_ID),
      exerciseNames(db),
      listPrograms(db),
      listWorkoutSessions(db, USER_ID, 100),
      listBodyMetrics(db, USER_ID, 60),
      listExternalWorkouts(db, USER_ID, 100),
      buildSlotHistory(db, USER_ID),
    ]);

  const programVersion =
    state === undefined
      ? undefined
      : await getProgramVersion(db, state.programVersionId);
  const absoluteWeek = (state?.absoluteWeek ?? 1) + weekOffset;

  const selected = await resolveScheduledDay(
    db,
    USER_ID,
    absoluteWeek,
    selectedDate,
  );
  const loggedSession = await getWorkoutSessionByDate(
    db,
    USER_ID,
    selectedDate,
  );
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
    isFuture: selectedDate > today,
    isToday: selectedDate === today,
    logged,
    programName: programLabel(selected, programs),
    selected,
    weekCount: weekCount(selected),
    weekLabel: dayLabel(selectedDate),
  });

  const summary = trendsSummary(metrics, sessions, externals);

  const data: DashboardData = {
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
        latestWeightLb: summary.latestWeightLb,
        series: summary.weightSeries,
      },
      names,
      rowPace: summary.rowPace,
      strengthSeries: summary.strengthSeries,
    },
    week: { days: week, selectedDate, weekOffset },
  };

  return <DashboardContent load={{ isLoading: false, value: data }} />;
};

export default DashboardPage;

/** The selected day: a valid `?date`, else today. */
const selectDate = (
  param: string | string[] | undefined,
  today: string,
): string => {
  const parsed = dateParamSchema.safeParse(param);
  return parsed.success ? parsed.data : today;
};

/** The shown week offset: a valid integer `?week`, else the current week. */
const selectWeek = (param: string | string[] | undefined): number => {
  const parsed = weekParamSchema.safeParse(param);
  return parsed.success ? parsed.data : 0;
};

/** The active program's name for the selected day, when a program is placed. */
const programLabel = (
  selected: Today,
  programs: Parameters<typeof programName>[0],
): string | undefined =>
  selected.kind === "workout"
    ? programName(programs, selected.programVersion.programId)
    : undefined;

/** "W3 / 8" — the selected day's week within its block. */
const weekCount = (selected: Today): string | undefined =>
  selected.kind === "workout"
    ? `W${selected.position.weekInBlock} / ${selected.position.block.durationWeeks}`
    : undefined;
