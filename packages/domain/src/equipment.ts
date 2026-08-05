import { z } from "zod";
import { idSchema } from "./ids";

/** A piece of equipment an exercise may require. Kept minimal for v1; exists so
 *  future equipment-aware substitution has a table to key off. */
export const equipmentSchema = z.object({
  id: idSchema,
  name: z.string(),
});

export type Equipment = z.infer<typeof equipmentSchema>;
