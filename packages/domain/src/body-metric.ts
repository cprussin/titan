import { z } from "zod";
import { idSchema } from "./ids";

/** A body measurement over time. v1 tracks bodyweight (lb); the schema leaves
 *  room for additional metrics without a migration. */
export const bodyMetricSchema = z.object({
  date: z.string(),
  id: idSchema,
  note: z.string().optional(),
  userId: idSchema,
  weightLb: z.number().positive(),
});

export type BodyMetric = z.infer<typeof bodyMetricSchema>;
