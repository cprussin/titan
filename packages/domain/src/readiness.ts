import { z } from "zod";
import { idSchema } from "./ids";

/**
 * A pre-workout **readiness** check-in. These values may reduce a session's
 * workload but must never automatically increase intensity (see the spec's
 * "Readiness" and "Session Adaptation").
 */
export const readinessEntrySchema = z.object({
  /** ISO weekday-agnostic capture date (YYYY-MM-DD). */
  availableMinutes: z.number().int().positive(),
  date: z.string(),
  /** 1 (exhausted) – 5 (fully energized). */
  energy: z.number().int().min(1).max(5),
  id: idSchema,
  /** 1 (terrible) – 5 (excellent). */
  sleepQuality: z.number().int().min(1).max(5),
  /** 1 (very sore) – 5 (no soreness). */
  soreness: z.number().int().min(1).max(5),
  userId: idSchema,
});

export type ReadinessEntry = z.infer<typeof readinessEntrySchema>;
