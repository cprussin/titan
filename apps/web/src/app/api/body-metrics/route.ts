import { randomUUID } from "node:crypto";
import { insertBodyMetric, listBodyMetrics } from "@titan/db/body-metrics";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiAuthGuard } from "../../../auth/session";
import { db } from "../../../db";
import { todayIso } from "../../../server/local-date";
import { USER_ID } from "../../../user";

const bodySchema = z.object({ weightLb: z.number().positive() });

/** How far back the weigh-in dialog's ledger reaches. */
const HISTORY_LIMIT = 60;

/** The weigh-ins on record, newest first — the ledger the weigh-in dialog reads
 *  when it opens. */
export const GET = async (): Promise<Response> => {
  const guard = await apiAuthGuard();
  if (guard === undefined) {
    const metrics = await listBodyMetrics(db, USER_ID, HISTORY_LIMIT);
    return NextResponse.json({ metrics });
  } else {
    return guard;
  }
};

export const POST = async (request: Request): Promise<Response> => {
  const guard = await apiAuthGuard();
  if (guard === undefined) {
    const { weightLb } = bodySchema.parse(await request.json());
    const id = randomUUID();
    await insertBodyMetric(db, {
      date: await todayIso(),
      id,
      userId: USER_ID,
      weightLb,
    });
    return NextResponse.json({ id });
  } else {
    return guard;
  }
};
