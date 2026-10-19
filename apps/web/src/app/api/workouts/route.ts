import { getReadinessByDate } from "@titan/db/readiness";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiAuthGuard } from "../../../auth/session";
import { db } from "../../../db";
import { todayIso } from "../../../server/local-date";
import { startWorkout } from "../../../server/start-workout";
import { resolveDay } from "../../../server/today";
import { USER_ID } from "../../../user";

/** The alternative the athlete picked for a session that offers a choice; absent
 *  for every session with one fixed shape. `date` fills in a missed past day;
 *  absent starts today's session. */
const bodySchema = z.object({
  alternativeId: z.string().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const POST = async (request: Request): Promise<Response> => {
  const guard = await apiAuthGuard();
  if (guard === undefined) {
    const { alternativeId, date } = bodySchema.parse(await request.json());
    const today = await todayIso();
    const scheduledDate = date ?? today;
    if (scheduledDate > today) {
      return NextResponse.json(
        { error: "cannot start a future workout" },
        { status: 400 },
      );
    } else {
      const day = await resolveDay(
        db,
        USER_ID,
        today,
        scheduledDate,
        alternativeId,
      );
      if (day.kind === "workout") {
        const readiness = await getReadinessByDate(db, USER_ID, scheduledDate);
        const id = await startWorkout(db, USER_ID, day, readiness?.id);
        return NextResponse.json({ id });
      } else {
        return NextResponse.json(
          { error: "no workout scheduled on this day" },
          { status: 400 },
        );
      }
    }
  } else {
    return guard;
  }
};
