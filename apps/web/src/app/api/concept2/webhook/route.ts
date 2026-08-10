import { getConnection } from "@titan/db/external-connections";
import { NextResponse } from "next/server";
import { db } from "../../../../db";
import { env } from "../../../../env";
import { ensureDbReady } from "../../../../server/ensure-db";
import { importConcept2Results } from "../../../../server/import-concept2-results";
import { isValidWebhookSecret } from "../../../../server/webhook-secret";
import { USER_ID } from "../../../../user";

/**
 * Concept2 result webhook. Concept2 has no session cookie to present, so the
 * call authenticates with a shared secret carried in the URL
 * (`?secret=…`) — checked before anything else, so an unauthenticated caller
 * learns nothing about configuration. A verified call re-runs the same
 * idempotent import the manual sync uses, keeping the Logbook history fresh in
 * the background; a row finished mid-workout then surfaces on the rowing
 * screen's next poll.
 */
export const POST = async (request: Request): Promise<Response> => {
  const provided = new URL(request.url).searchParams.get("secret") ?? undefined;
  if (!isValidWebhookSecret(provided, env.CONCEPT2_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  } else if (
    env.CONCEPT2_CLIENT_ID === undefined ||
    env.CONCEPT2_CLIENT_SECRET === undefined
  ) {
    return NextResponse.json(
      { error: "Concept2 is not configured" },
      { status: 400 },
    );
  } else {
    await ensureDbReady();
    const connection = await getConnection(db, USER_ID, "concept2");
    if (connection === undefined) {
      return NextResponse.json({ error: "not connected" }, { status: 400 });
    } else {
      const outcomes = await importConcept2Results(
        connection,
        env.CONCEPT2_CLIENT_ID,
        env.CONCEPT2_CLIENT_SECRET,
      );
      return NextResponse.json({
        imported: outcomes.filter((outcome) => outcome.inserted).length,
      });
    }
  }
};
