import { z } from "zod";
import { idSchema } from "./ids";
import { prescriptionSchema } from "./prescription";
import { slotRoleSchema } from "./program";
import { progressionPolicySchema } from "./progression-policy";
import { exerciseResultSchema } from "./result";

/**
 * The **workout session**: a scheduled instance of a session template, carrying
 * both the resolved plan (what to do) and the results (what happened). The plan
 * is stored verbatim so a historical session is never recomputed when the
 * program later changes.
 */

/** A single warm-up set the engine generated ahead of a working set. Its load
 *  is in the working set's unit (kg for barbell, else lb). */
export const warmupSetSchema = z.object({
  reps: z.number().int().positive(),
  weight: z.number().nonnegative(),
});

export type WarmupSet = z.infer<typeof warmupSetSchema>;

/** A resolved plan item: one exercise's concrete prescription for this session,
 *  with generated warm-up and the last session's result for the on-screen
 *  "previous performance" hint. */
export const prescribedExerciseSchema = z.object({
  exerciseId: idSchema,
  prescription: prescriptionSchema,
  /** The prior result for this exercise, surfaced during execution. */
  previous: exerciseResultSchema.optional(),
  progression: progressionPolicySchema,
  role: slotRoleSchema,
  slotId: idSchema,
  warmup: z.array(warmupSetSchema).optional(),
});

export type PrescribedExercise = z.infer<typeof prescribedExerciseSchema>;

export const workoutStatusSchema = z.enum([
  "scheduled",
  "in-progress",
  "completed",
  "skipped",
]);

export type WorkoutStatus = z.infer<typeof workoutStatusSchema>;

export const workoutSessionSchema = z.object({
  adaptationDecisionIds: z.array(idSchema).optional(),
  blockId: idSchema,
  completedAt: z.string().optional(),
  dayOfWeek: z.number().int().min(1).max(7),
  estimatedDurationMin: z.number().int().positive(),
  id: idSchema,
  prescribedExercises: z.array(prescribedExerciseSchema),
  programVersionId: idSchema,
  readinessId: idSchema.optional(),
  results: z.array(exerciseResultSchema),
  /** ISO date (YYYY-MM-DD) the session is scheduled for. */
  scheduledDate: z.string(),
  sessionTemplateId: idSchema,
  startedAt: z.string().optional(),
  status: workoutStatusSchema,
  userId: idSchema,
  /** The rotation label chosen for this session, when the template rotates. */
  variantLabel: z.string().optional(),
  /** 1-based week number within the block. */
  weekNumber: z.number().int().positive(),
});

export type WorkoutSession = z.infer<typeof workoutSessionSchema>;
