import { NextResponse } from "next/server";
import { z } from "zod";
import { apiAuthGuard } from "../../../auth/session";
import { db } from "../../../db";
import { todayIso } from "../../../server/local-date";
import { loadWeekSchedule } from "../../../server/week-ribbon-data";
import { USER_ID } from "../../../user";

/** `?offset` pages whole weeks off the athlete's current week — 0 is that week,
 *  1 the next, −1 the previous — matching the dashboard's `?week` param. */
const offsetSchema = z.coerce.number().int();

/** Resolve one week of the dashboard ribbon so the picker can lazy-load the
 *  weeks on either side of the one the page rendered. */
export const GET = async (request: Request): Promise<Response> => {
  const guard = await apiAuthGuard();
  if (guard === undefined) {
    const offset = offsetSchema.parse(
      new URL(request.url).searchParams.get("offset"),
    );
    const days = await loadWeekSchedule(db, USER_ID, await todayIso(), offset);
    return NextResponse.json({ days });
  } else {
    return guard;
  }
};
