import type { AdaptationDecision } from "@titan/domain/adaptation-decision";

/** Maps each exercise-layer adaptation decision to its explanation, keyed by
 *  exercise id, so the execution screen can surface why today's target is what
 *  it is. Non-exercise decisions (session/weekly) carry no exercise id and are
 *  dropped. */
export const explanationsByExercise = (
  decisions: readonly AdaptationDecision[],
): Record<string, string> =>
  Object.fromEntries(
    decisions.flatMap((decision) =>
      decision.exerciseId === undefined
        ? []
        : [[decision.exerciseId, decision.explanation] as const],
    ),
  );
