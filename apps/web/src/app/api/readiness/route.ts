import { randomUUID } from "node:crypto";
import { insertReadiness } from "@titan/db/readiness";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiAuthGuard } from "../../../auth/session";
import { db } from "../../../db";
import { todayIso } from "../../../server/local-date";
import { USER_ID } from "../../../user";

/** The Android app also sends the check-in's `id` and its `date`, so one
 *  logged offline keeps its day and a replayed save writes it once. */
const bodySchema = z.object({
  availableMinutes: z.number().int().positive(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  energy: z.number().int().min(1).max(5),
  id: z.uuid().optional(),
  sleepQuality: z.number().int().min(1).max(5),
  soreness: z.number().int().min(1).max(5),
});

export const POST = async (request: Request): Promise<Response> => {
  const guard = await apiAuthGuard();
  if (guard === undefined) {
    const {
      date,
      id: requestedId,
      ...ratings
    } = bodySchema.parse(await request.json());
    const id = requestedId ?? randomUUID();
    await insertReadiness(db, {
      ...ratings,
      date: date ?? (await todayIso()),
      id,
      userId: USER_ID,
    });
    return NextResponse.json({ id });
  } else {
    return guard;
  }
};
