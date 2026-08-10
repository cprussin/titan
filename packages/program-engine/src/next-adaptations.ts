import { progressExercise } from "@titan/adaptation-engine/progress-exercise";
import type { AdaptationAction } from "@titan/domain/adaptation-decision";
import type { ExerciseSlot } from "@titan/domain/program";
import type { ExerciseResult } from "@titan/domain/result";

/** The forward adaptation for one exercise: what its progression policy will do
 *  the next time the lift is trained, given history through the latest session,
 *  and whether that move is a step forward (`progressed`) rather than a hold. */
export type NextAdaptation = {
  action: AdaptationAction;
  exerciseId: string;
  explanation: string;
  progressed: boolean;
  slotId: string;
};

/** The exercise-level actions that move a lift forward (heavier, more reps,
 *  longer, faster). Every other action — maintain, repeat, deload — holds. */
const PROGRESSION_ACTIONS: readonly AdaptationAction[] = [
  "increase-load",
  "increase-reps",
  "increase-duration",
  "advance-pace",
];

/**
 * Project each slot's next adaptation by running its progression policy against
 * history that already includes the most recent session. Pure and total — one
 * {@link NextAdaptation} per slot, in the order given — so the completion screen
 * can show what the next session does to every lift and why. Unlike
 * {@link resolveSession} this never selects a variant or substitutes a deload:
 * it projects the plain progression for the exact slots just trained.
 */
export const projectNextAdaptations = (
  slots: readonly ExerciseSlot[],
  historyBySlot: (slotId: string) => readonly ExerciseResult[],
): readonly NextAdaptation[] =>
  slots.map((slot) => {
    const outcome = progressExercise(
      slot.progression,
      slot.base,
      historyBySlot(slot.id),
    );
    return {
      action: outcome.action,
      exerciseId: slot.exerciseId,
      explanation: outcome.explanation,
      progressed: PROGRESSION_ACTIONS.includes(outcome.action),
      slotId: slot.id,
    };
  });
