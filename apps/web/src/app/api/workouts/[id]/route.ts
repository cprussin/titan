import { setWorkoutSessionProgress } from "@titan/db/workout-sessions";
import { NextResponse } from "next/server";
import { apiAuthGuard } from "../../../../auth/session";
import { db } from "../../../../db";
import { cancelWorkout } from "../../../../server/cancel-workout";
import type { CompletionResult } from "../../../../server/complete-workout";
import {
  CompletionOutcome,
  completeWorkout,
} from "../../../../server/complete-workout";
import {
  RecordOutcome,
  recordExercise,
} from "../../../../server/record-exercise";
import { USER_ID } from "../../../../user";
import { workoutProgressRequestSchema } from "../../../../workout-progress-request";

/**
 * Record where the athlete is in a session. Each variant reports only what the
 * athlete just did — the sets underway, or the one exercise recorded — so the
 * recorded log stays the server's and a device working from a stale view can
 * never shrink or rewrite it. Every write is conditional, in the statement that
 * changes the row, on the session still being in progress; the two that add to
 * the log are additionally conditional on it still holding the results their
 * handler read, so a session advanced elsewhere in between turns those writes
 * away rather than letting them overwrite it.
 */
export const PATCH = async (
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> => {
  const guard = await apiAuthGuard();
  if (guard === undefined) {
    const { id } = await context.params;
    const body = workoutProgressRequestSchema.parse(await request.json());
    switch (body.kind) {
      case "sets": {
        const stored = await setWorkoutSessionProgress(db, id, body.inProgress);
        return stored ? NextResponse.json({ ok: true }) : sessionClosed();
      }
      case "recorded": {
        return recorded(await recordExercise(db, id, body.recorded));
      }
      case "finished": {
        return finished(await completeWorkout(db, USER_ID, id, body.recorded));
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

/** The answer to a save that added an exercise to the log. Switched rather than
 *  branched so a new outcome is a compile error here. */
const recorded = (outcome: RecordOutcome): Response => {
  switch (outcome) {
    case RecordOutcome.Recorded: {
      return NextResponse.json({ ok: true });
    }
    case RecordOutcome.SessionClosed: {
      return sessionClosed();
    }
  }
};

/** The answer to a save that finished the session, carrying the personal records
 *  it set for the completion screen. */
const finished = (result: CompletionResult): Response => {
  switch (result.outcome) {
    case CompletionOutcome.Completed: {
      return NextResponse.json({ personalRecords: result.personalRecords });
    }
    case CompletionOutcome.SessionClosed: {
      return sessionClosed();
    }
  }
};

/** A session that is finished, cancelled, or gone takes no more progress — one
 *  state as far as a save is concerned. The client reads the conflict as the
 *  session being closed to it and refreshes onto wherever the athlete now
 *  belongs, so a save whose response was lost resolves itself rather than
 *  retrying forever. */
const sessionClosed = (): Response =>
  NextResponse.json(
    { error: "workout session is closed to further progress" },
    { status: 409 },
  );
