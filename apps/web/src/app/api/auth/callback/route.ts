import { NextResponse } from "next/server";
import {
  isEmailAllowed,
  parseAllowedEmails,
} from "../../../../auth/allowed-emails";
import { isOriginAllowed } from "../../../../auth/allowed-origin";
import { exchangeCode, fetchUserInfo } from "../../../../auth/google";
import { signHandoff } from "../../../../auth/oauth-handoff";
import { verifyState } from "../../../../auth/oauth-state";
import { env } from "../../../../env";

/** The single registered Google redirect URI. Always lands here on production
 *  (the proxy), whichever deployment started sign-in. Verifies the signed
 *  `state`, exchanges the code, checks the allowlist, then issues a short-lived
 *  handoff and bounces back to the origin recorded in `state` — which may be a
 *  preview — where the session cookie is actually set. */
export const GET = async (request: Request): Promise<Response> => {
  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  const stateToken = params.get("state");
  const state =
    stateToken === null
      ? undefined
      : verifyState(env.AUTH_SESSION_SECRET, stateToken);

  if (
    code === null ||
    state === undefined ||
    !isOriginAllowed(
      env.AUTH_PROXY_URL,
      env.AUTH_PREVIEW_HOST_SUFFIX,
      state.origin,
    )
  ) {
    return NextResponse.redirect(
      new URL("/login?error=auth", env.AUTH_PROXY_URL),
    );
  } else {
    const token = await exchangeCode({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      code,
      redirectUri: `${env.AUTH_PROXY_URL}/api/auth/callback`,
    });
    const info = await fetchUserInfo(token.access_token);
    const allowed = parseAllowedEmails(env.GOOGLE_ALLOWED_EMAILS);
    if (info.email_verified && isEmailAllowed(allowed, info.email)) {
      const handoff = signHandoff(
        env.AUTH_SESSION_SECRET,
        {
          nonce: state.nonce,
          user: {
            email: info.email,
            name: info.name,
            picture: info.picture,
          },
        },
        Date.now(),
      );
      const target = new URL("/api/auth/complete", state.origin);
      target.searchParams.set("token", handoff);
      return NextResponse.redirect(target);
    } else {
      return NextResponse.redirect(
        new URL("/login?error=forbidden", state.origin),
      );
    }
  }
};
