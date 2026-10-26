import { randomUUID } from "node:crypto";
import { insertBodyMetric, listBodyMetrics } from "@titan/db/body-metrics";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiAuthGuard } from "../../../auth/session";
import { db } from "../../../db";
import { todayIso } from "../../../server/local-date";
import { USER_ID } from "../../../user";

/** The Android app also sends the weigh-in's `id` and the `date` it was taken,
 *  so one logged offline keeps its day and a replayed save writes it once. */
const bodySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  id: z.uuid().optional(),
  weightLb: z.number().positive(),
});

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
    const body = bodySchema.parse(await request.json());
    const id = body.id ?? randomUUID();
    await insertBodyMetric(db, {
      date: body.date ?? (await todayIso()),
      id,
      userId: USER_ID,
      weightLb: body.weightLb,
    });
    return NextResponse.json({ id });
  } else {
    return guard;
  }
};
