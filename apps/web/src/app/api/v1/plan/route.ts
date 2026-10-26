import { NextResponse } from "next/server";
import { z } from "zod";
import { apiAuthGuard } from "../../../../auth/session";
import { db } from "../../../../db";
import { loadOfflinePlan } from "../../../../server/load-offline-plan";
import { todayIso } from "../../../../server/local-date";
import { USER_ID } from "../../../../user";

/** How many days ahead, today included, the app may ask to have resolved. */
const daysSchema = z.coerce.number().int().min(1).max(14);

/** Today and the days after it resolved for the Android app to start offline. */
export const GET = async (request: Request): Promise<Response> => {
  const guard = await apiAuthGuard();
  if (guard === undefined) {
    const days = daysSchema.parse(
      new URL(request.url).searchParams.get("days"),
    );
    const today = await todayIso();
    const plan = await loadOfflinePlan(db, USER_ID, today, days);
    return NextResponse.json({ ...plan, today });
  } else {
    return guard;
  }
};
