import { deleteBodyMetric } from "@titan/db/body-metrics";
import { NextResponse } from "next/server";
import { apiAuthGuard } from "../../../../../auth/session";
import { db } from "../../../../../db";

export const DELETE = async (
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> => {
  const guard = await apiAuthGuard();
  if (guard === undefined) {
    const { id } = await context.params;
    await deleteBodyMetric(db, id);
    return NextResponse.json({ ok: true });
  } else {
    return guard;
  }
};
