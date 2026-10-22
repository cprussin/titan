import type { Prescription } from "@titan/domain/prescription";
import { Prescription as Rx } from "@titan/domain/prescription";
import type { AmrapPolicy } from "@titan/domain/progression-policy";
import type { ExerciseResult } from "@titan/domain/result";
import { countSetsReaching, mostRecent } from "./history";
import type { AdaptationOutcome } from "./outcome";

/**
 * AMRAP progression (ab wheel): each set is taken to its max, and the target
 * climbs toward the rep cap. Once every set of the last session met its target,
 * the next target is one rep over that session's weakest set; a session that
 * fell short holds its target. The target never drops below the base nor rises
 * above the cap. Once the athlete reaches the cap on every set, the movement
 * graduates to harder variations (pauses, added load) — which the engine
 * surfaces as a note rather than auto-loading, since the progression is
 * qualitative.
 */
export const progressAmrap = (
  policy: AmrapPolicy,
  base: Prescription,
  priorResults: readonly ExerciseResult[],
): AdaptationOutcome => {
  if (base.type === "bodyweight") {
    const last = mostRecent(priorResults);
    return last === undefined
      ? {
          action: "maintain",
          details: { repCap: policy.repCap },
          explanation: `Work toward ${policy.sets}×${policy.repCap} as an AMRAP each set.`,
          prescription: base,
        }
      : decide(policy, base, last);
  } else {
    throw new Error(
      `amrap policy requires a bodyweight base, got ${base.type}`,
    );
  }
};

const decide = (
  policy: AmrapPolicy,
  base: Extract<Prescription, { type: "bodyweight" }>,
  last: ExerciseResult,
): AdaptationOutcome => {
  const target = lastTarget(last);
  const cappedOut = countSetsReaching(last, policy.repCap) >= policy.sets;
  const met = countSetsReaching(last, target) >= policy.sets;
  const reps = Math.min(
    policy.repCap,
    Math.max(base.reps, met ? weakestSet(last, policy.sets) + 1 : target),
  );
  const prescription = Rx.Bodyweight({
    reps,
    sets: policy.sets,
    unit: base.unit,
  });
  return cappedOut
    ? {
        action: "maintain",
        details: { repCap: policy.repCap },
        explanation: `Hold ${policy.sets}×${policy.repCap}: rep cap reached — progress next block via added load or paused reps.`,
        prescription,
      }
    : {
        action: reps > target ? "increase-reps" : "repeat",
        details: { fromReps: target, toReps: reps },
        explanation: `Aim for at least ${reps} reps on each of ${policy.sets} AMRAP sets, working toward ${policy.repCap}.`,
        prescription,
      };
};

/** The per-set rep target the last session was measured against. */
const lastTarget = (result: ExerciseResult): number => {
  const { prescription } = result;
  if (prescription.type === "bodyweight") {
    return prescription.reps;
  } else {
    throw new Error(
      `amrap history expects a bodyweight prescription, got ${prescription.type}`,
    );
  }
};

/** The reps every one of the top `sets` completed sets reached. */
const weakestSet = (result: ExerciseResult, sets: number): number =>
  result.sets
    .filter((set) => set.completed)
    .map((set) => set.reps ?? 0)
    .sort((a, b) => b - a)
    .slice(0, sets)
    .reduce((min, reps) => Math.min(min, reps), Number.POSITIVE_INFINITY);
