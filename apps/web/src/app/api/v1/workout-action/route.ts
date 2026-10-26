import { NextResponse } from "next/server";
import { apiAuthGuard } from "../../../../auth/session";
import { db } from "../../../../db";
import { currentWorkoutAction } from "../../../../server/current-workout-action";
import { todayIso } from "../../../../server/local-date";
import { USER_ID } from "../../../../user";

/** The app-wide workout action for today — start, continue, or done — with the
 *  athlete's today, so the app can tell when its copy has gone stale. */
export const GET = async (): Promise<Response> => {
  const guard = await apiAuthGuard();
  if (guard === undefined) {
    const today = await todayIso();
    const action = await currentWorkoutAction(db, USER_ID, today);
    return NextResponse.json({ action, today });
  } else {
    return guard;
  }
};
