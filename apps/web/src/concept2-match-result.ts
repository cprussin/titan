import type { NormalizedWorkout } from "@titan/domain/external";
import { normalizedWorkoutSchema } from "@titan/domain/external";
import { z } from "zod";

/**
 * The result of asking the server whether a synced Concept2 workout matches the
 * session being executed. Neither "no match" nor "more than one match" is a
 * failure — the first is an ordinary outcome the caller keeps polling through,
 * the second a question only the athlete can answer — so both are variants of
 * the union rather than errors. This is a wire contract (the match endpoint's
 * response), so the Zod schema is the source of truth and the discriminant stays
 * a literal (see DATA.md / DISCRIMINATED_UNIONS.md); it is shared by the route
 * and its client in the same deploy unit, so no versioning.
 */

const matchedSchema = z.object({
  normalized: normalizedWorkoutSchema,
  status: z.literal("matched"),
});

/** Ambiguous by definition carries the rows the athlete chooses between, so
 *  fewer than two is a malformed response rather than a degenerate one. */
const ambiguousSchema = z.object({
  candidates: z.array(normalizedWorkoutSchema).min(2),
  status: z.literal("ambiguous"),
});

const notMatchedSchema = z.object({ status: z.literal("not-matched") });

export const concept2MatchResultSchema = z.discriminatedUnion("status", [
  matchedSchema,
  ambiguousSchema,
  notMatchedSchema,
]);

export type Concept2MatchResult = z.infer<typeof concept2MatchResultSchema>;

export const Concept2MatchResult = {
  Ambiguous: (
    candidates: readonly NormalizedWorkout[],
  ): z.infer<typeof ambiguousSchema> => ({
    candidates: [...candidates],
    status: "ambiguous",
  }),
  Matched: (normalized: NormalizedWorkout): z.infer<typeof matchedSchema> => ({
    normalized,
    status: "matched",
  }),
  NotMatched: (): z.infer<typeof notMatchedSchema> => ({
    status: "not-matched",
  }),
};
