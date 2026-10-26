import { NextResponse } from "next/server";
import { z } from "zod";
import { redeemAppHandoff } from "../../../../../../auth/app-sign-in";
import { signSession } from "../../../../../../auth/token";
import { env } from "../../../../../../env";

const bodySchema = z.object({ handoff: z.string(), verifier: z.string() });

/** The last leg of the Android app's sign-in: trade the handoff the deep link
 *  delivered, plus the verifier only the app holds, for a session token the app
 *  then sends as a bearer token. */
export const POST = async (request: Request): Promise<Response> => {
  const { handoff, verifier } = bodySchema.parse(await request.json());
  const user = redeemAppHandoff(
    env.AUTH_SESSION_SECRET,
    handoff,
    verifier,
    Date.now(),
  );
  return user === undefined
    ? NextResponse.json({ error: "unauthorized" }, { status: 401 })
    : NextResponse.json({
        token: signSession(env.AUTH_SESSION_SECRET, user),
        user,
      });
};
