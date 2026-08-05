import { z } from "zod";
import { idSchema } from "./ids";
import { modalitySchema, movementPatternSchema } from "./movement";

/**
 * A movement the athlete performs. Exercises are shared, global entities that
 * program definitions reference by id — an exercise never embeds its own
 * progression logic (that lives in the slot's {@link ProgressionPolicy}).
 */
export const exerciseSchema = z.object({
  equipmentIds: z.array(idSchema).optional(),
  id: idSchema,
  /** Unilateral movements (split squats, carries) are prescribed per side. */
  isUnilateral: z.boolean(),
  modality: modalitySchema,
  movementPattern: movementPatternSchema,
  name: z.string(),
  notes: z.string().optional(),
});

export type Exercise = z.infer<typeof exerciseSchema>;
