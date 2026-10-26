import { NextResponse } from "next/server";
import { env } from "../../../../../../env";

/** What the Android app needs before signing in: the Google client its in-app
 *  sign-in requests ID tokens for (public, like the web consent URL's). */
export const GET = (): Response =>
  NextResponse.json({ googleClientId: env.GOOGLE_CLIENT_ID });
