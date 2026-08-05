import { z } from "zod";

/**
 * The primary movement pattern an exercise trains. Used by the scheduler to
 * express constraints ("no heavy lower-body lifting the day before row
 * intervals") and by analytics to group volume. Persisted as a string, so this
 * is a wire enum, not an in-memory `enum` (see DISCRIMINATED_UNIONS.md).
 */
export const movementPatternSchema = z.enum([
  "squat",
  "hinge",
  "lunge",
  "horizontal-push",
  "vertical-push",
  "horizontal-pull",
  "vertical-pull",
  "carry",
  "core",
  "calf",
  "conditioning",
  "cardio",
]);

export type MovementPattern = z.infer<typeof movementPatternSchema>;

/** The equipment/modality an exercise is performed with. Drives Concept2
 *  matching (`rower`) and equipment-aware scheduling. */
export const modalitySchema = z.enum([
  "barbell",
  "dumbbell",
  "kettlebell",
  "bodyweight",
  "machine",
  "rower",
  "run",
  "bike",
  "hike",
  "other",
]);

export type Modality = z.infer<typeof modalitySchema>;
