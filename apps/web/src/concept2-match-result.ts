import type { NormalizedWorkout } from "@titan/domain/external";
import { normalizedWorkoutSchema } from "@titan/domain/external";
import { z } from "zod";

/**
 * The result of asking the server whether a synced Concept2 workout matches the
 * session being executed. "No match" is an ordinary outcome the caller branches
 * on, so it is a variant of the union rather than an error. This is a wire
 * contract (the match endpoint's response), so the Zod schema is the source of
 * truth and the discriminant stays a literal (see DATA.md / DISCRIMINATED_UNIONS.md);
 * it is shared by the route and its client in the same deploy unit, so no
 * versioning.
 */
export const concept2MatchResultSchema = z.discriminatedUnion("matched", [
  z.object({ matched: z.literal(true), normalized: normalizedWorkoutSchema }),
  z.object({ matched: z.literal(false) }),
]);

export type Concept2MatchResult = z.infer<typeof concept2MatchResultSchema>;

export const Concept2MatchResult = {
  Matched: (normalized: NormalizedWorkout): Concept2MatchResult => ({
    matched: true,
    normalized,
  }),
  NotMatched: (): Concept2MatchResult => ({ matched: false }),
};
