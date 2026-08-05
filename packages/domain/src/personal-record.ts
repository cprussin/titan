import { z } from "zod";
import { idSchema } from "./ids";

/** The kind of record a {@link PersonalRecord} captures. */
export const personalRecordKindSchema = z.enum([
  "top-weight",
  "rep-max",
  "estimated-1rm",
  "distance",
  "fastest-split",
  "longest-duration",
]);

export type PersonalRecordKind = z.infer<typeof personalRecordKindSchema>;

/** A personal record for an exercise, detected from workout results. */
export const personalRecordSchema = z.object({
  achievedAt: z.string(),
  exerciseId: idSchema,
  id: idSchema,
  kind: personalRecordKindSchema,
  unit: z.string(),
  userId: idSchema,
  value: z.number(),
  workoutSessionId: idSchema,
});

export type PersonalRecord = z.infer<typeof personalRecordSchema>;
