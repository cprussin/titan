import { NextResponse } from "next/server";
import { z } from "zod";
import { APP_SIGN_IN_ORIGIN } from "../../../../../../auth/app-sign-in";
import { buildAuthorizeUrl } from "../../../../../../auth/google";
import { signState } from "../../../../../../auth/oauth-state";
import { env } from "../../../../../../env";

const challengeSchema = z.string().min(43);

/** Start the Android app's Google sign-in. The app opens this in a browser tab
 *  with the PKCE challenge for a verifier it keeps; the challenge rides the
 *  signed `state` as the flow's nonce, and the app's origin tells the callback
 *  to hand the result back to the app (see `app-sign-in.ts`). */
export const GET = (request: Request): Response => {
  const challenge = challengeSchema.parse(
    new URL(request.url).searchParams.get("challenge"),
  );
  const state = signState(env.AUTH_SESSION_SECRET, {
    nonce: challenge,
    origin: APP_SIGN_IN_ORIGIN,
  });
  return NextResponse.redirect(
    buildAuthorizeUrl({
      clientId: env.GOOGLE_CLIENT_ID,
      redirectUri: `${env.AUTH_PROXY_URL}/api/auth/callback`,
      state,
    }),
  );
};
