import { getReadinessByDate } from "@titan/db/readiness";
import { NextResponse } from "next/server";
import { apiAuthGuard } from "../../../auth/session";
import { dateIso } from "../../../date";
import { db } from "../../../db";
import { startWorkout } from "../../../server/start-workout";
import { resolveToday } from "../../../server/today";
import { USER_ID } from "../../../user";

export const POST = async (): Promise<Response> => {
  const guard = await apiAuthGuard();
  if (guard === undefined) {
    const date = dateIso();
    const today = await resolveToday(db, USER_ID, date);
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
