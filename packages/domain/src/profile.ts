import { z } from "zod";
import { idSchema } from "./ids";

/**
 * The athlete. v1 is single-user and self-hosted, but everything is keyed by
 * `userId` so multi-user is a data change, not a re-architecture (see the spec's
 * "Overview").
 */
export const userSchema = z.object({
  createdAt: z.string(),
  displayName: z.string(),
  id: idSchema,
});

export type User = z.infer<typeof userSchema>;
