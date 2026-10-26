import { NextResponse } from "next/server";
import { DELETE as deleteHandler } from "../../../../app/api/history/route";
import { apiAuthGuard } from "../../../../auth/session";
import { db } from "../../../../db";
import { loadHistory } from "../../../../server/load-history";
import { USER_ID } from "../../../../user";

/** The history ledger — what the history page renders. */
export const GET = async (): Promise<Response> => {
  const guard = await apiAuthGuard();
  return guard === undefined
    ? NextResponse.json(await loadHistory(db, USER_ID))
    : guard;
};

/** The Android app's versioned mount of the web route (see DATA.md). */
export const DELETE = deleteHandler;
