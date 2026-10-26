import { NextResponse } from "next/server";
import { z } from "zod";
import {
  isEmailAllowed,
  parseAllowedEmails,
} from "../../../../../../auth/allowed-emails";
import { verifyIdToken } from "../../../../../../auth/google";
import { signSession } from "../../../../../../auth/token";
import { env } from "../../../../../../env";

const bodySchema = z.object({ idToken: z.string() });

/** The Android app's in-app sign-in: trade the Google ID token Credential
 *  Manager returned, issued to this server's client, for a session token. The
 *  same allowlist as the web sign-in applies. */
export const POST = async (request: Request): Promise<Response> => {
  const { idToken } = bodySchema.parse(await request.json());
  const info = await verifyIdToken(idToken, env.GOOGLE_CLIENT_ID);
  if (info === undefined) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  } else if (
    !info.email_verified ||
    !isEmailAllowed(parseAllowedEmails(env.GOOGLE_ALLOWED_EMAILS), info.email)
  ) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  } else {
    const user = { email: info.email, name: info.name, picture: info.picture };
    return NextResponse.json({
      token: signSession(env.AUTH_SESSION_SECRET, user),
      user,
    });
  }
};
