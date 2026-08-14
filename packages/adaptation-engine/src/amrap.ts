import type { Prescription } from "@titan/domain/prescription";
import type { AmrapPolicy } from "@titan/domain/progression-policy";
import type { ExerciseResult } from "@titan/domain/result";
import { countSetsReaching, mostRecent } from "./history";
import type { AdaptationOutcome } from "./outcome";

/**
 * AMRAP progression (ab wheel): hold the prescription at its rep cap. Once the
 * athlete reaches the cap on every set, the movement graduates to harder
 * variations (pauses, added load) — which the engine surfaces as a note rather
 * than auto-loading, since the progression is qualitative.
 */
export const progressAmrap = (
  policy: AmrapPolicy,
  base: Prescription,
  priorResults: readonly ExerciseResult[],
): AdaptationOutcome => {
  if (base.type === "bodyweight") {
    const last = mostRecent(priorResults);
    const cappedOut =
      last !== undefined &&
      countSetsReaching(last, policy.repCap) >= policy.sets;
    return {
      action: "maintain",
      details: { repCap: policy.repCap },
      explanation: cappedOut
        ? `Hold ${policy.sets}×${policy.repCap}: rep cap reached — progress next block via added load or paused reps.`
        : `Work toward ${policy.sets}×${policy.repCap} as an AMRAP each set.`,
      prescription: base,
    };
  } else {
    throw new Error(
      `amrap policy requires a bodyweight base, got ${base.type}`,
    );
  }
};
