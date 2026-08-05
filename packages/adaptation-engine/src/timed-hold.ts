import type { Prescription } from "@titan/domain/prescription";
import { Prescription as Rx } from "@titan/domain/prescription";
import type { TimedHoldPolicy } from "@titan/domain/progression-policy";
import type { ExerciseResult } from "@titan/domain/result";
import { metHoldTarget, mostRecent } from "./history";
import type { AdaptationOutcome } from "./outcome";

/** Added load, in pounds, once a hold has maxed out its duration (plank). */
const HOLD_WEIGHT_STEP_LB = 5;

/**
 * Timed-hold progression (plank): extend the hold by `holdIncrementSec` each
 * session until it reaches `addWeightAfterSec`, then keep the hold at that
 * duration and add weight instead.
 */
export const progressTimedHold = (
  policy: TimedHoldPolicy,
  base: Prescription,
  priorResults: readonly ExerciseResult[],
): AdaptationOutcome => {
  if (base.type === "timed-hold") {
    const last = mostRecent(priorResults);
    return last === undefined || last.prescription.type !== "timed-hold"
      ? {
          action: "maintain",
          explanation: `Starting planks at ${policy.startSec}s for ${policy.sets} sets.`,
          prescription: base,
        }
      : decide(policy, last, last.prescription);
  } else {
    throw new Error(
      `timed-hold policy requires a timed-hold base, got ${base.type}`,
    );
  }
};

const decide = (
  policy: TimedHoldPolicy,
  last: ExerciseResult,
  lastPrescription: Extract<Prescription, { type: "timed-hold" }>,
): AdaptationOutcome => {
  const { holdSec, addedWeightLb = 0 } = lastPrescription;
  const at = (nextHold: number, nextWeight: number | undefined): Prescription =>
    Rx.TimedHold({
      ...(nextWeight !== undefined && nextWeight > 0
        ? { addedWeightLb: nextWeight }
        : {}),
      holdSec: nextHold,
      sets: policy.sets,
    });

  if (!metHoldTarget(last)) {
    return {
      action: "repeat",
      details: { holdSec },
      explanation: `Repeat ${holdSec}s holds: last session's holds weren't completed.`,
      prescription: at(holdSec, addedWeightLb),
    };
  } else if (holdSec >= policy.addWeightAfterSec) {
    const weight = addedWeightLb + HOLD_WEIGHT_STEP_LB;
    return {
      action: "increase-load",
      details: { addedWeightLb: weight, holdSec },
      explanation: `Hold at ${holdSec}s and add ${HOLD_WEIGHT_STEP_LB} lb (to ${weight} lb): the duration ceiling is reached.`,
      prescription: at(holdSec, weight),
    };
  } else {
    const next = holdSec + policy.holdIncrementSec;
    return {
      action: "increase-duration",
      details: { fromSec: holdSec, toSec: next },
      explanation: `Extend planks from ${holdSec}s to ${next}s.`,
      prescription: at(next, addedWeightLb),
    };
  }
};
