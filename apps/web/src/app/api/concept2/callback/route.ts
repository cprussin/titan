import { randomUUID } from "node:crypto";
import { exchangeCode } from "@titan/concept2/oauth";
import { upsertConnection } from "@titan/db/external-connections";
import type { ExternalConnection } from "@titan/domain/external";
import { NextResponse } from "next/server";
import { apiAuthGuard } from "../../../../auth/session";
import { db } from "../../../../db";
import { env } from "../../../../env";
import { USER_ID } from "../../../../user";

export const GET = async (request: Request): Promise<Response> => {
  const guard = await apiAuthGuard();
  if (guard !== undefined) {
    return guard;
  } else if (
    env.CONCEPT2_CLIENT_ID === undefined ||
    env.CONCEPT2_CLIENT_SECRET === undefined ||
    env.CONCEPT2_REDIRECT_URI === undefined
  ) {
    return NextResponse.json(
      { error: "Concept2 is not configured" },
      { status: 400 },
    );
  } else {
    const code = new URL(request.url).searchParams.get("code");
    if (code === null) {
      return NextResponse.json({ error: "missing code" }, { status: 400 });
    } else {
      const token = await exchangeCode({
        clientId: env.CONCEPT2_CLIENT_ID,
        clientSecret: env.CONCEPT2_CLIENT_SECRET,
        code,
        redirectUri: env.CONCEPT2_REDIRECT_URI,
      });
      const connection: ExternalConnection = {
        accessToken: token.access_token,
        expiresAt: Date.now() + token.expires_in * 1000,
        id: randomUUID(),
        provider: "concept2",
        refreshToken: token.refresh_token,
        scope: token.scope,
        userId: USER_ID,
      };
      await upsertConnection(db, connection);
      return NextResponse.redirect(new URL("/analytics", request.url));
    }
  }
};
