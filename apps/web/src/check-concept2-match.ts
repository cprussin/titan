import type { Concept2MatchResult } from "./concept2-match-result";
import { concept2MatchResultSchema } from "./concept2-match-result";

/**
 * Sync Concept2 and ask whether any imported workout matches the given session.
 * Parses the response at the boundary (see DATA.md) and throws on a non-OK
 * status so the caller surfaces the failure rather than treating it as "no
 * match".
 */
export const checkConcept2Match = async (
  sessionId: string,
): Promise<Concept2MatchResult> => {
  const response = await fetch(`/api/workouts/${sessionId}/concept2-match`, {
    method: "POST",
  });
  if (response.ok) {
    return concept2MatchResultSchema.parse(await response.json());
  } else {
    throw new Error(`Concept2 check failed: ${response.status}`);
  }
};
