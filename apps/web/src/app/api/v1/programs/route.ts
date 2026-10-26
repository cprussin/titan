import { NextResponse } from "next/server";
import { apiAuthGuard } from "../../../../auth/session";
import { db } from "../../../../db";
import { loadPrograms } from "../../../../server/load-programs";
import { todayIso } from "../../../../server/local-date";
import { USER_ID } from "../../../../user";

/** The program explorer — what the programs page renders. */
export const GET = async (): Promise<Response> => {
  const guard = await apiAuthGuard();
  return guard === undefined
    ? NextResponse.json(await loadPrograms(db, USER_ID, await todayIso()))
    : guard;
};
