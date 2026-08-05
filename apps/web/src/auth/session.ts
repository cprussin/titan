import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { env } from "../env";
import { ensureDbReady } from "../server/ensure-db";
import { verifyToken } from "./token";

/** Name of the session cookie holding the signed auth token. */
export const SESSION_COOKIE = "titan_session";

/** Whether the current request carries a valid session cookie. */
export const isAuthenticated = async (): Promise<boolean> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return token !== undefined && verifyToken(env.AUTH_SESSION_SECRET, token);
};

/** Redirect to the login screen unless the request is authenticated. Call at the
 *  top of every protected server component / page. */
export const requireAuth = async (): Promise<void> => {
  // The auth check reads cookies first, which marks the route dynamic (and, at
  // build time, bails out of prerendering) before any database work runs.
  if (await isAuthenticated()) {
    await ensureDbReady();
  } else {
    redirect("/login");
  }
};

/** For route handlers: a 401 response when unauthenticated, or `undefined` to
 *  proceed. Ensures the database is initialized before an authorized handler
 *  runs. */
export const apiAuthGuard = async (): Promise<Response | undefined> => {
  if (await isAuthenticated()) {
    await ensureDbReady();
    return undefined;
  } else {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
};
