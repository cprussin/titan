import { randomUUID } from "node:crypto";
import { insertAdaptationDecisions } from "@titan/db/adaptation-decisions";
import type { Db } from "@titan/db/client";
import { upsertWorkoutSession } from "@titan/db/workout-sessions";
import { buildSession } from "./build-session";
import type { Today } from "./today";

type WorkoutToday = Extract<Today, { kind: "workout" }>;

/**
 * Persist a new in-progress session from today's resolved plan, along with the
 * adaptation decisions that produced it. Returns the new session id.
 */
export const startWorkout = async (
  db: Db,
  userId: string,
  today: WorkoutToday,
  readinessId: string | undefined,
): Promise<string> => {
  const { decisions, session } = buildSession({
    blockId: today.position.block.id,
    createdAt: new Date().toISOString(),
    dayOfWeek: today.dayOfWeek,
    decisions: today.resolved.decisions,
    estimatedDurationMin: today.resolved.estimatedDurationMin,
    newId: randomUUID,
    prescribedExercises: today.resolved.prescribedExercises,
    programVersionId: today.programVersion.id,
    readinessId,
    scheduledDate: today.scheduledDate,
    sessionTemplateId: today.template.id,
    userId,
    variantLabel: today.resolved.variantLabel,
    weekNumber: today.position.weekInBlock,
  });
  await upsertWorkoutSession(db, session);
  await insertAdaptationDecisions(db, decisions);
  return session.id;
};
