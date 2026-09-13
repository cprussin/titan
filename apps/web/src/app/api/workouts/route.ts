import { getReadinessByDate } from "@titan/db/readiness";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiAuthGuard } from "../../../auth/session";
import { db } from "../../../db";
import { todayIso } from "../../../server/local-date";
import { startWorkout } from "../../../server/start-workout";
import { resolveToday } from "../../../server/today";
import { USER_ID } from "../../../user";

/** The alternative the athlete picked for a session that offers a choice; absent
 *  for every session with one fixed shape. */
const bodySchema = z.object({ alternativeId: z.string().optional() });

export const POST = async (request: Request): Promise<Response> => {
  const guard = await apiAuthGuard();
  if (guard === undefined) {
    const { alternativeId } = bodySchema.parse(await request.json());
    const date = await todayIso();
    const today = await resolveToday(db, USER_ID, date, alternativeId);
    if (today.kind === "workout") {
      const readiness = await getReadinessByDate(db, USER_ID, date);
      const id = await startWorkout(db, USER_ID, today, readiness?.id);
      return NextResponse.json({ id });
    } else {
      return NextResponse.json(
        { error: "no workout scheduled today" },
        { status: 400 },
      );
    }
  } else {
    return guard;
  }
};
