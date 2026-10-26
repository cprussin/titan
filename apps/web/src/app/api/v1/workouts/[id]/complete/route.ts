import { getWorkoutSession } from "@titan/db/workout-sessions";
import { NextResponse } from "next/server";
import { apiAuthGuard } from "../../../../../../auth/session";
import { db } from "../../../../../../db";
import { loadComplete } from "../../../../../../server/load-complete";
import { wireJson } from "../../../../../../server/wire-json";
import { USER_ID } from "../../../../../../user";

/** A finished session's summary — what the completion page renders. */
export const GET = async (
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> => {
  const guard = await apiAuthGuard();
  if (guard === undefined) {
    const { id } = await context.params;
    const session = await getWorkoutSession(db, id);
    return session === undefined
      ? NextResponse.json({ error: "not found" }, { status: 404 })
      : NextResponse.json(wireJson(await loadComplete(db, USER_ID, session)));
  } else {
    return guard;
  }
};
