import { randomUUID } from "node:crypto";
import { insertReadiness } from "@titan/db/readiness";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiAuthGuard } from "../../../auth/session";
import { dateIso } from "../../../date";
import { db } from "../../../db";
import { USER_ID } from "../../../user";

const bodySchema = z.object({
  availableMinutes: z.number().int().positive(),
  energy: z.number().int().min(1).max(5),
  sleepQuality: z.number().int().min(1).max(5),
  soreness: z.number().int().min(1).max(5),
});

export const POST = async (request: Request): Promise<Response> => {
  const guard = await apiAuthGuard();
  if (guard === undefined) {
    const body = bodySchema.parse(await request.json());
    const id = randomUUID();
    await insertReadiness(db, {
      ...body,
      date: dateIso(),
      id,
      userId: USER_ID,
    });
    return NextResponse.json({ id });
  } else {
    return guard;
  }
};
