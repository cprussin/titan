import { NextResponse } from "next/server";
import { apiAuthGuard } from "../../../../auth/session";
import { db } from "../../../../db";
import { selectDate, selectWeek } from "../../../../server/dashboard-params";
import { loadDashboard } from "../../../../server/load-dashboard";
import { todayIso } from "../../../../server/local-date";
import { wireJson } from "../../../../server/wire-json";
import { USER_ID } from "../../../../user";

/** The dashboard for `?date`, its week picker paged `?week` weeks off the
 *  current one — what the dashboard page renders. */
export const GET = async (request: Request): Promise<Response> => {
  const guard = await apiAuthGuard();
  if (guard === undefined) {
    const params = new URL(request.url).searchParams;
    const today = await todayIso();
    const dashboard = await loadDashboard(
      db,
      USER_ID,
      today,
      selectDate(params.get("date"), today),
      selectWeek(params.get("week")),
    );
    return NextResponse.json(wireJson(dashboard));
  } else {
    return guard;
  }
};
