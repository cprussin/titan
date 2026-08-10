import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { env } from "../env";
import { ensureDbReady } from "../server/ensure-db";
import type { SessionUser } from "./token";
import { verifySession } from "./token";

/** Name of the session cookie holding the signed auth token. */
export const SESSION_COOKIE = "titan_session";

/** Name of the short-lived cookie holding the sign-in `nonce`. Set on the
 *  deployment that starts sign-in and matched against the handoff when the flow
 *  completes there, binding it to the same browser (CSRF guard). */
export const OAUTH_NONCE_COOKIE = "titan_oauth_nonce";

/** The identity in the current request's session cookie, or `undefined` when
 *  the request carries no valid session. */
export const getSession = async (): Promise<SessionUser | undefined> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return token === undefined
    ? undefined
    : verifySession(env.AUTH_SESSION_SECRET, token);
};

/** Redirect to the login screen unless the request is authenticated, otherwise
 *  return the signed-in user. Call at the top of every protected server
 *  component / page. */
export const requireAuth = async (): Promise<SessionUser> => {
  // The auth check reads cookies first, which marks the route dynamic (and, at
  // build time, bails out of prerendering) before any database work runs.
  const session = await getSession();
  if (session === undefined) {
    redirect("/login");
  } else {
    await ensureDbReady();
    return session;
  }
};

/** For route handlers: a 401 response when unauthenticated, or `undefined` to
 *  proceed. Ensures the database is initialized before an authorized handler
 *  runs. */
export const apiAuthGuard = async (): Promise<Response | undefined> => {
  if ((await getSession()) === undefined) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  } else {
    await ensureDbReady();
    return undefined;
  }
};
