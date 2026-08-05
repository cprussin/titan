import type { AdaptationAction } from "@titan/domain/adaptation-decision";
import type { Prescription } from "@titan/domain/prescription";

/**
 * The result of running an exercise-progression policy: the next
 * {@link Prescription} to prescribe, the {@link AdaptationAction} taken, and a
 * plain-English {@link explanation} the app records as an
 * `AdaptationDecision`. `details` carries the structured numbers behind the
 * explanation (from/to weight, average RPE) for analytics. Progression is total
 * and deterministic — there is always an outcome, so no `Result` is needed.
 */
export type AdaptationOutcome = {
  action: AdaptationAction;
  details?: Record<string, number>;
  explanation: string;
  prescription: Prescription;
};
