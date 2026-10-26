import type { Metadata } from "next";
import { requireAuth } from "../../auth/session";
import { DashboardContent } from "../../components/DashboardContent";
import { db } from "../../db";
import { selectDate, selectWeek } from "../../server/dashboard-params";
import { loadDashboard } from "../../server/load-dashboard";
import { todayIso } from "../../server/local-date";
import { USER_ID } from "../../user";

export const metadata: Metadata = {
  description: "Today's plan and your recent training trends at a glance.",
  title: "Dashboard",
};

const DashboardPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  await requireAuth();
  const today = await todayIso();
  const params = await searchParams;
  const data = await loadDashboard(
    db,
    USER_ID,
    today,
    selectDate(params.date, today),
    selectWeek(params.week),
  );
  return <DashboardContent load={{ isLoading: false, value: data }} />;
};

export default DashboardPage;
