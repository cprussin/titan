import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyHandoff } from "../../../../auth/oauth-handoff";
import { OAUTH_NONCE_COOKIE, SESSION_COOKIE } from "../../../../auth/session";
import { signSession } from "../../../../auth/token";
import { env } from "../../../../env";

const THIRTY_DAYS_SEC = 60 * 60 * 24 * 30;

/** The final leg, back on the deployment that started sign-in (production or a
 *  preview). Verifies the handoff and matches it against the `nonce` cookie set
 *  here at the start — proving it's the same browser — then sets the session
 *  cookie on this origin. */
export const GET = async (request: Request): Promise<Response> => {
  const token = new URL(request.url).searchParams.get("token");
  const store = await cookies();
  const nonce = store.get(OAUTH_NONCE_COOKIE)?.value;
  const handoff =
    token === null
      ? undefined
      : verifyHandoff(env.AUTH_SESSION_SECRET, token, Date.now());

  if (handoff === undefined || nonce === undefined || handoff.nonce !== nonce) {
    return NextResponse.redirect(new URL("/login?error=auth", request.url));
  } else {
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set(
      SESSION_COOKIE,
      signSession(env.AUTH_SESSION_SECRET, handoff.user),
      {
        httpOnly: true,
        maxAge: THIRTY_DAYS_SEC,
        path: "/",
        sameSite: "lax",
        secure: env.NODE_ENV === "production",
      },
    );
    response.cookies.delete(OAUTH_NONCE_COOKIE);
    return response;
  }
};
