import { randomUUID } from "node:crypto";
import { buildAuthorizeUrl } from "@titan/concept2/oauth";
import { NextResponse } from "next/server";
import { apiAuthGuard } from "../../../../auth/session";
import { env } from "../../../../env";

/** Concept2 Logbook scopes: read the athlete's profile and results. */
const SCOPE = "user:read,results:read";

export const GET = async (): Promise<Response> => {
  const guard = await apiAuthGuard();
  if (guard !== undefined) {
    return guard;
  } else if (
    env.CONCEPT2_CLIENT_ID === undefined ||
    env.CONCEPT2_REDIRECT_URI === undefined
  ) {
    return NextResponse.json(
      { error: "Concept2 is not configured" },
      { status: 400 },
    );
  } else {
    const url = buildAuthorizeUrl({
      clientId: env.CONCEPT2_CLIENT_ID,
      redirectUri: env.CONCEPT2_REDIRECT_URI,
      scope: SCOPE,
      state: randomUUID(),
    });
    return NextResponse.redirect(url);
  }
};
