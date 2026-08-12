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
import type { WorkoutSession } from "@titan/domain/workout-session";
import type { Metadata } from "next";
import { z } from "zod";
import { css, cx } from "../../../styled-system/css";
import { vstack } from "../../../styled-system/patterns";
import { DashboardHeader } from "../../components/DashboardHeader";
import { LogGrid } from "../../components/LogGrid";
import { NoteAside } from "../../components/NoteAside";
import { PrescriptionGrid } from "../../components/PrescriptionGrid";
import { SessionHeader } from "../../components/SessionHeader";
import { TopBar } from "../../components/TopBar";
import { TrendsBand } from "../../components/TrendsBand";
import { WeekRibbon } from "../../components/WeekRibbon";
import { WeighInProvider } from "../../components/WeighInContext";
import { db } from "../../db";
import { programName } from "../../program-name";
import type {
  DashboardBody,
  DashboardSession,
} from "../../server/dashboard-view";
import { dashboardView } from "../../server/dashboard-view";
import { exerciseNames } from "../../server/exercise-names";
import { todayIso } from "../../server/local-date";
import { loggedSessionView } from "../../server/logged-session-view";
import { buildSlotHistory, historyLookup } from "../../server/slot-history";
import type { Today } from "../../server/today";
import { resolveScheduledDay } from "../../server/today";
import { trendsSummary } from "../../server/trends-summary";
import { dayLabel, weekDates } from "../../server/week-dates";
import { weekSchedule } from "../../server/week-schedule";
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
    loggedByDate: completedByDate(sessions),
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
  const weighedInToday = metrics.at(0)?.date === today;

  return (
    <div className={pageStyles}>
      <TopBar icon={<GaugeIcon size={18} />} title="Dashboard" />
      <WeighInProvider>
        <div className={contentStyles}>
          <TrendsBand
            bodyWeight={{
              latestWeightLb: summary.latestWeightLb,
              series: summary.weightSeries,
            }}
            names={names}
            rowPace={summary.rowPace}
            strengthSeries={summary.strengthSeries}
          />
          <div className={sectionStyles}>
            <WeekRibbon
              days={week}
              selectedDate={selectedDate}
              weekOffset={weekOffset}
            />
          </div>
          <div className={sectionStyles}>
            <DashboardHeader
              eyebrow={view.eyebrow}
              primary={view.primary}
              title={view.title}
              weighedInToday={weighedInToday}
            />
          </div>
          <SessionBlock body={view.body} names={names} session={view.session} />
        </div>
      </WeighInProvider>
    </div>
  );
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

/** The session block: the session header over the day's grid, or a rest
 *  message. Adaptation notes follow a logged grid; a projection's caveat is
 *  already in the session summary, so a prescription needs no aside. */
const SessionBlock = ({
  body,
  names,
  session,
}: {
  body: DashboardBody;
  names: ReadonlyMap<string, string>;
  session: DashboardSession | undefined;
}) => {
  switch (body.kind) {
    case "rest": {
      return (
        <section className={sectionStyles}>
          <p className={copyStyles}>{body.copy}</p>
        </section>
      );
    }
    case "prescription": {
      return (
        <section className={cx(sectionStyles, blockStyles)}>
          {session !== undefined && (
            <SessionHeader label={session.label} summary={session.summary} />
          )}
          <PrescriptionGrid
            exercises={body.exercises}
            loadHeader={body.loadHeader}
            names={names}
          />
        </section>
      );
    }
    case "log": {
      return (
        <section className={cx(sectionStyles, blockStyles)}>
          {session !== undefined && (
            <SessionHeader label={session.label} summary={session.summary} />
          )}
          <LogGrid exercises={body.view.exercises} />
          <NoteAside notes={body.view.notes} />
        </section>
      );
    }
  }
};

const pageStyles = vstack({ alignItems: "stretch", gap: 4, lg: { gap: 6 } });

// The redesigned dashboard flows as one column, capped at a readable measure and
// centered. Trends open it; each later section is set off by a hairline rule.
const contentStyles = vstack({
  alignItems: "stretch",
  gap: 6,
  marginInline: "auto",
  maxInlineSize: "64rem",
  width: "100%",
});

const sectionStyles = css({
  borderBlockStart: "1px solid {colors.border}",
  paddingBlockStart: 6,
});

const blockStyles = css({
  alignItems: "stretch",
  display: "flex",
  flexDirection: "column",
  gap: 6,
});

const copyStyles = css({
  color: "muted",
  fontSize: "sm",
  maxInlineSize: "40rem",
});
