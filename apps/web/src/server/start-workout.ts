import { randomUUID } from "node:crypto";
import { insertAdaptationDecisions } from "@titan/db/adaptation-decisions";
import type { Db } from "@titan/db/client";
import {
  listWorkoutSessions,
  upsertWorkoutSession,
} from "@titan/db/workout-sessions";
import { buildSession } from "./build-session";
import { findResumableSession } from "./resumable-session";
import type { Today } from "./today";

type WorkoutToday = Extract<Today, { kind: "workout" }>;

/** The new session's id and start time. The Android app supplies both, so a
 *  workout started offline keeps its id and the time it really began; the web
 *  leaves them to the server. */
export type WorkoutStart = {
  id: string;
  startedAt: string;
};

/**
 * Start today's workout, returning the session id to navigate into. Idempotent:
 * if an in-progress session already exists for the day it is returned as-is, so
 * the same workout can't be started twice. Otherwise a new in-progress session
 * is persisted from the resolved plan along with the adaptation decisions that
 * produced it.
 */
export const startWorkout = async (
  db: Db,
  userId: string,
  today: WorkoutToday,
  readinessId: string | undefined,
  start: WorkoutStart,
): Promise<string> => {
  const existing = findResumableSession(
    await listWorkoutSessions(db, userId, 50),
    today.scheduledDate,
  );
  return existing === undefined
    ? createWorkout(db, userId, today, readinessId, start)
    : existing.id;
};

const createWorkout = async (
  db: Db,
  userId: string,
  today: WorkoutToday,
  readinessId: string | undefined,
  start: WorkoutStart,
): Promise<string> => {
  const { decisions, session } = buildSession({
    blockId: today.position.block.id,
    createdAt: start.startedAt,
    dayOfWeek: today.dayOfWeek,
    decisions: today.resolved.decisions,
    estimatedDurationMin: today.resolved.estimatedDurationMin,
    newId: randomUUID,
    prescribedExercises: today.resolved.prescribedExercises,
    programVersionId: today.programVersion.id,
    readinessId,
    scheduledDate: today.scheduledDate,
    sessionId: start.id,
    sessionTemplateId: today.template.id,
    userId,
    variantLabel: today.resolved.variantLabel,
    weekNumber: today.position.weekInBlock,
  });
  await upsertWorkoutSession(db, session);
  await insertAdaptationDecisions(db, decisions);
  return session.id;
};
