import { NextResponse } from "next/server";
import { getSession } from "../../../../auth/session";
import { db } from "../../../../db";
import { ensureDbReady } from "../../../../server/ensure-db";
import { loadSettings } from "../../../../server/load-settings";
import { USER_ID } from "../../../../user";

/** The settings screen's account and integration state. */
export const GET = async (): Promise<Response> => {
  const user = await getSession();
  if (user === undefined) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  } else {
    await ensureDbReady();
    return NextResponse.json(await loadSettings(db, USER_ID, user.email));
  }
};
