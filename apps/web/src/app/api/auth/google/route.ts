import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { buildAuthorizeUrl } from "../../../../auth/google";
import { signState } from "../../../../auth/oauth-state";
import { requestOrigin } from "../../../../auth/request-origin";
import { OAUTH_NONCE_COOKIE } from "../../../../auth/session";
import { env } from "../../../../env";

const TEN_MINUTES_SEC = 60 * 10;

/** Start the Google sign-in flow from whichever deployment the athlete is on.
 *  A random `nonce` goes into both a cookie here and the signed `state` (which
 *  also records this deployment's origin); the redirect always points Google at
 *  the production callback — the only registered redirect URI — so previews
 *  authenticate through it. */
export const GET = (request: Request): Response => {
  const nonce = randomUUID();
  const state = signState(env.AUTH_SESSION_SECRET, {
    nonce,
    origin: requestOrigin(request),
  });
  const response = NextResponse.redirect(
    buildAuthorizeUrl({
      clientId: env.GOOGLE_CLIENT_ID,
      redirectUri: `${env.AUTH_PROXY_URL}/api/auth/callback`,
      state,
    }),
  );
  response.cookies.set(OAUTH_NONCE_COOKIE, nonce, {
    httpOnly: true,
    maxAge: TEN_MINUTES_SEC,
    path: "/",
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
  });
  return response;
};
