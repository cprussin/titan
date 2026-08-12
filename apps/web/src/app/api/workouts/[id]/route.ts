import {
  getWorkoutSession,
  upsertWorkoutSession,
} from "@titan/db/workout-sessions";
import { exerciseResultSchema } from "@titan/domain/result";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiAuthGuard } from "../../../../auth/session";
import { db } from "../../../../db";
import { cancelWorkout } from "../../../../server/cancel-workout";
import { completeWorkout } from "../../../../server/complete-workout";
import { stampResultTimes } from "../../../../server/stamp-result-times";
import { USER_ID } from "../../../../user";

const bodySchema = z.object({
  complete: z.boolean().default(false),
  results: z.array(exerciseResultSchema),
});

export const PATCH = async (
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> => {
  const guard = await apiAuthGuard();
  if (guard === undefined) {
    const { id } = await context.params;
    const body = bodySchema.parse(await request.json());
    if (body.complete) {
      const { personalRecords } = await completeWorkout(
        db,
        USER_ID,
        id,
        body.results,
      );
      return NextResponse.json({ personalRecords });
    } else {
      const session = await getWorkoutSession(db, id);
      if (session === undefined) {
        return NextResponse.json({ error: "not found" }, { status: 404 });
      } else {
        const results = stampResultTimes(
          session.results,
          body.results,
          new Date().toISOString(),
        );
        await upsertWorkoutSession(db, { ...session, results });
        return NextResponse.json({ ok: true });
      }
    }
  } else {
    return guard;
  }
};

export const DELETE = async (
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> => {
  const guard = await apiAuthGuard();
  if (guard === undefined) {
    const { id } = await context.params;
    await cancelWorkout(db, id);
    return NextResponse.json({ ok: true });
  } else {
    return guard;
  }
};
