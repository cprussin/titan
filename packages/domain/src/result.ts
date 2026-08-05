import { z } from "zod";
import { idSchema } from "./ids";
import { prescriptionSchema } from "./prescription";

/**
 * The **workout result** layer: what actually happened, append-only. A
 * {@link SetResult} records one strength/bodyweight/hold set; a
 * {@link CardioResult} summarizes a continuous cardio effort; an
 * {@link IntervalResult} records one interval. An {@link ExerciseResult} carries
 * a snapshot of the prescription it was measured against, so a result is
 * self-describing even if the program later changes.
 */

export const setResultSchema = z.object({
  completed: z.boolean(),
  /** For timed holds (plank). */
  holdSec: z.number().nonnegative().optional(),
  reps: z.number().int().nonnegative().optional(),
  /** Rate of perceived exertion, 1–10. */
  rpe: z.number().positive().max(10).optional(),
  setIndex: z.number().int().nonnegative(),
  weightLb: z.number().nonnegative().optional(),
});

export type SetResult = z.infer<typeof setResultSchema>;

export const cardioResultSchema = z.object({
  avgHr: z.number().positive().optional(),
  avgStrokeRate: z.number().positive().optional(),
  distanceMeters: z.number().nonnegative().optional(),
  durationSec: z.number().nonnegative().optional(),
  /** Fractional heart-rate drift across the effort (late-avg / early-avg − 1). */
  hrDrift: z.number().optional(),
  splitSecPer500: z.number().positive().optional(),
});

export type CardioResult = z.infer<typeof cardioResultSchema>;

export const intervalResultSchema = z.object({
  avgHr: z.number().positive().optional(),
  distanceMeters: z.number().nonnegative().optional(),
  durationSec: z.number().nonnegative().optional(),
  index: z.number().int().nonnegative(),
  splitSecPer500: z.number().positive().optional(),
  strokeRate: z.number().positive().optional(),
});

export type IntervalResult = z.infer<typeof intervalResultSchema>;

export const exerciseResultSchema = z.object({
  cardio: cardioResultSchema.optional(),
  exerciseId: idSchema,
  id: idSchema,
  intervals: z.array(intervalResultSchema).optional(),
  notes: z.string().optional(),
  /** Snapshot of the prescription this result was measured against. */
  prescription: prescriptionSchema,
  sets: z.array(setResultSchema),
  slotId: idSchema,
});

export type ExerciseResult = z.infer<typeof exerciseResultSchema>;
