import { randomUUID } from "node:crypto";
import { insertBodyMetric } from "@titan/db/body-metrics";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiAuthGuard } from "../../../auth/session";
import { dateIso } from "../../../date";
import { db } from "../../../db";
import { USER_ID } from "../../../user";

const bodySchema = z.object({ weightLb: z.number().positive() });

export const POST = async (request: Request): Promise<Response> => {
  const guard = await apiAuthGuard();
  if (guard === undefined) {
    const { weightLb } = bodySchema.parse(await request.json());
    const id = randomUUID();
    await insertBodyMetric(db, {
      date: dateIso(),
      id,
      userId: USER_ID,
      weightLb,
    });
    return NextResponse.json({ id });
  } else {
    return guard;
  }
};
