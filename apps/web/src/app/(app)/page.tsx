import { GaugeIcon } from "@phosphor-icons/react/dist/ssr/Gauge";
import { listBodyMetrics } from "@titan/db/body-metrics";
import { listExternalWorkouts } from "@titan/db/external-workouts";
import { listPrograms } from "@titan/db/program-versions";
import { listWorkoutSessions } from "@titan/db/workout-sessions";
import type { Metadata } from "next";
import { vstack } from "../../../styled-system/patterns";
import { TodaySummary } from "../../components/TodaySummary";
import { TopBar } from "../../components/TopBar";
import { TrendsSection } from "../../components/TrendsSection";
import { db } from "../../db";
import { exerciseNames } from "../../server/exercise-names";
import { todayIso } from "../../server/local-date";
import { resolveToday } from "../../server/today";
import { trendsSummary } from "../../server/trends-summary";
import { resolveWorkoutAction } from "../../server/workout-action";
import { USER_ID } from "../../user";

export const metadata: Metadata = {
  description: "Today's plan and your recent training trends at a glance.",
  title: "Dashboard",
};

const DashboardPage = async () => {
  const date = await todayIso();
  const today = await resolveToday(db, USER_ID, date);
  const [names, programs, metrics, sessions, externals] = await Promise.all([
    exerciseNames(db),
    listPrograms(db),
    listBodyMetrics(db, USER_ID, 60),
    listWorkoutSessions(db, USER_ID, 100),
    listExternalWorkouts(db, USER_ID, 100),
  ]);
  const summary = trendsSummary(metrics, sessions, externals);
  const action = resolveWorkoutAction(today, sessions, date);

  return (
    <div className={pageStyles}>
      <TopBar icon={<GaugeIcon size={18} />} title="Dashboard" />
      <TodaySummary
        action={action}
        names={names}
        programs={programs}
        today={today}
      />
      <TrendsSection metrics={metrics} names={names} summary={summary} />
    </div>
  );
};

export default DashboardPage;

// The day's plan and the trends block each sit in their own card; a modest gap
// separates the two stacked cards.
const pageStyles = vstack({ alignItems: "stretch", gap: 4, lg: { gap: 6 } });
