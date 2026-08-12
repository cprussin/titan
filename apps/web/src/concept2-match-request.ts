import { idSchema } from "@titan/domain/ids";
import { z } from "zod";

/**
 * The body of a Concept2 match check: the slot the athlete is currently
 * logging. The endpoint matches every imported result to its exact cardio slot,
 * so the check reports back only the workout bound to this slot — a session with
 * both a 10k piece and a cooldown row then hands each row to the right step.
 * Shared by the route and its client in the same deploy unit, so no versioning.
 */
export const concept2MatchRequestSchema = z.object({ slotId: idSchema });

export type Concept2MatchRequest = z.infer<typeof concept2MatchRequestSchema>;
