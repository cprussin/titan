import { GaugeIcon } from "@phosphor-icons/react/dist/ssr/Gauge";
import { listAdaptationDecisionsBySession } from "@titan/db/adaptation-decisions";
import { getAthleteState } from "@titan/db/athlete-state";
import { listBodyMetrics } from "@titan/db/body-metrics";
import { listExternalWorkouts } from "@titan/db/external-workouts";
import { getProgramVersion, listPrograms } from "@titan/db/program-versions";
import {
  getWorkoutSessionByDate,
  listWorkoutSessions,
} from "@titan/db/workout-sessions";
import type { ProgramVersion } from "@titan/domain/program";
import type { WorkoutSession } from "@titan/domain/workout-session";
import type { Metadata } from "next";
import { z } from "zod";
import { css } from "../../../styled-system/css";
import { vstack } from "../../../styled-system/patterns";
import { DashboardHeader } from "../../components/DashboardHeader";
import { LogGrid } from "../../components/LogGrid";
import { NoteAside } from "../../components/NoteAside";
import { PrescriptionGrid } from "../../components/PrescriptionGrid";
import { TopBar } from "../../components/TopBar";
import { TrendsBand } from "../../components/TrendsBand";
import { WeekRibbon } from "../../components/WeekRibbon";
import { db } from "../../db";
import { programName } from "../../program-name";
import type { DashboardBody } from "../../server/dashboard-view";
import { dashboardView } from "../../server/dashboard-view";
import { exerciseNames } from "../../server/exercise-names";
import { todayIso } from "../../server/local-date";
import { loggedSessionView } from "../../server/logged-session-view";
import { buildSlotHistory, historyLookup } from "../../server/slot-history";
import { resolveToday } from "../../server/today";
import { trendsSummary } from "../../server/trends-summary";
import { dayLabel, weekDates } from "../../server/week-dates";
import { weekSchedule } from "../../server/week-schedule";
import { resolveWorkoutAction } from "../../server/workout-action";
import { USER_ID } from "../../user";

export const metadata: Metadata = {
  description: "Today's plan and your recent training trends at a glance.",
  title: "Dashboard",
};

/** The `?date` param, when present, selects a day of the current week. */
const dateParamSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const DashboardPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const today = await todayIso();
  const selectedDate = selectDate((await searchParams).date, today);

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

  const selected = await resolveToday(db, USER_ID, selectedDate);
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
    absoluteWeek: state?.absoluteWeek ?? 1,
    historyBySlot: historyLookup(historyMap),
    loggedByDate: completedByDate(sessions),
    names,
    programVersion,
    today,
    weekDates: weekDates(today),
  });

  const view = dashboardView({
    action: resolveWorkoutAction(selected, sessions, selectedDate),
    isFuture: selectedDate > today,
    isToday: selectedDate === today,
    logged,
    nextLabel: nextTrainingLabel(week, today),
    programContext: programContext(selected, programs, programVersion),
    selected,
    weekLabel: dayLabel(selectedDate),
  });

  const summary = trendsSummary(metrics, sessions, externals);
  const latestMetric = metrics.at(0);

  return (
    <div className={pageStyles}>
      <TopBar icon={<GaugeIcon size={18} />} title="Dashboard" />
      <div className={contentStyles}>
        <DashboardHeader
          eyebrow={view.eyebrow}
          eyebrowTone={view.eyebrowTone}
          subtitle={view.subtitle}
          title={view.title}
          trailing={view.trailing}
        />
        <WeekRibbon days={week} selectedDate={selectedDate} />
        <Body body={view.body} names={names} />
        <div className={trendsStyles}>
          <TrendsBand
            bodyWeight={{
              lastWeighInLabel:
                latestMetric === undefined
                  ? undefined
                  : relativeDayLabel(latestMetric.date, today),
              latestWeightLb: summary.latestWeightLb,
              series: summary.weightSeries,
              weighedInToday: latestMetric?.date === today,
            }}
            names={names}
            rowPace={summary.rowPace}
            strengthSeries={summary.strengthSeries}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

/** The day the page shows: a valid `?date` within the week, else today. */
const selectDate = (
  param: string | string[] | undefined,
  today: string,
): string => {
  const parsed = dateParamSchema.safeParse(param);
  return parsed.success ? parsed.data : today;
};

/** Completed sessions keyed by their scheduled date, for the ribbon. */
const completedByDate = (
  sessions: readonly WorkoutSession[],
): ReadonlyMap<string, WorkoutSession> => {
  const byDate = new Map<string, WorkoutSession>();
  for (const session of sessions) {
    if (session.status === "completed") {
      byDate.set(session.scheduledDate, session);
    }
  }
  return byDate;
};

/** "{Program} · Week X of Y" for the selected day, when a program is placed. */
const programContext = (
  selected: Awaited<ReturnType<typeof resolveToday>>,
  programs: Parameters<typeof programName>[0],
  programVersion: ProgramVersion | undefined,
): string | undefined => {
  if (selected.kind !== "workout" || programVersion === undefined) {
    return undefined;
  } else {
    const { block, weekInBlock } = selected.position;
    return `${programName(programs, selected.programVersion.programId)} · Week ${weekInBlock} of ${block.durationWeeks}`;
  }
};

/** The next training day after today in the visible week, as "Row Intervals ·
 *  Thu 13", or `undefined` when the rest of the week is clear. */
const nextTrainingLabel = (
  week: ReturnType<typeof weekSchedule>,
  today: string,
): string | undefined => {
  const next = week.find((day) => day.date > today && day.kind === "planned");
  return next === undefined || next.kind !== "planned"
    ? undefined
    : `${next.name} · ${titleCaseLabel(next.label)}`;
};

/** A weigh-in's recency for the body-weight card: Today, Yesterday, or the
 *  day's ribbon label. */
const relativeDayLabel = (date: string, today: string): string => {
  if (date === today) {
    return "Today";
  } else {
    return date === previousDay(today) ? "Yesterday" : dayLabel(date);
  }
};

/** The `YYYY-MM-DD` calendar day before `date`. */
const previousDay = (date: string): string => {
  const shifted = new Date(`${date}T00:00:00.000Z`);
  shifted.setUTCDate(shifted.getUTCDate() - 1);
  return shifted.toISOString().slice(0, 10);
};

/** A ribbon label ("THU 13") title-cased for prose ("Thu 13"). */
const titleCaseLabel = (label: string): string =>
  label.replace(
    /^(\w)(\w+)/,
    (_match, head: string, tail: string) => `${head}${tail.toLowerCase()}`,
  );

/** The body below the ribbon: the prescription ledger, the log, or a rest
 *  message. Projection notes sit above the prescription; adaptation notes below
 *  the log. */
const Body = ({
  body,
  names,
}: {
  body: DashboardBody;
  names: ReadonlyMap<string, string>;
}) => {
  switch (body.kind) {
    case "prescription": {
      return (
        <div className={bodyStyles}>
          {body.note !== undefined && <NoteAside notes={[body.note]} />}
          <PrescriptionGrid
            exercises={body.exercises}
            loadHeader={body.loadHeader}
            names={names}
          />
        </div>
      );
    }
    case "log": {
      return (
        <div className={bodyStyles}>
          <LogGrid exercises={body.view.exercises} />
          <NoteAside notes={body.view.notes} />
        </div>
      );
    }
    case "rest": {
      return <p className={copyStyles}>{body.copy}</p>;
    }
  }
};

const pageStyles = vstack({ alignItems: "stretch", gap: 4, lg: { gap: 6 } });

// The redesigned dashboard flows as one column, capped at a readable measure and
// centered, its sections separated by generous space.
const contentStyles = vstack({
  alignItems: "stretch",
  gap: 6,
  marginInline: "auto",
  maxInlineSize: "64rem",
  width: "100%",
});

const bodyStyles = vstack({ alignItems: "stretch", gap: 6 });

// A hairline rule sets the trends band off from the plan above it.
const trendsStyles = css({
  borderBlockStart: "1px solid {colors.border}",
  paddingBlockStart: 6,
});

const copyStyles = css({
  color: "muted",
  fontSize: "sm",
  maxInlineSize: "40rem",
});
