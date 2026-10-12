import type { LoadUnit } from "@titan/domain/load-unit";
import { kgToLb, lbToKg, loadStep } from "@titan/domain/load-unit";
import type { Prescription } from "@titan/domain/prescription";
import { Prescription as Rx } from "@titan/domain/prescription";
import type { TimedHoldPolicy } from "@titan/domain/progression-policy";
import type { ExerciseResult } from "@titan/domain/result";
import { metHoldTarget, mostRecent } from "./history";
import type { AdaptationOutcome } from "./outcome";
import { roundLoad } from "./round-load";

type TimedHoldPrescription = Extract<Prescription, { type: "timed-hold" }>;

/**
 * Timed-hold progression (plank): extend the hold by `holdIncrementSec` each
 * session until it reaches `addWeightAfterSec`, then keep the hold at that
 * duration and add one plate step ({@link loadStep}) of weight instead. Load
 * stays in the base's unit; a prior load in another unit (pre-kilogram pounds)
 * is converted onto the base's plate grid.
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
      : decide(policy, base.unit, last, last.prescription);
  } else {
    throw new Error(
      `timed-hold policy requires a timed-hold base, got ${base.type}`,
    );
  }
};

const decide = (
  policy: TimedHoldPolicy,
  unit: LoadUnit,
  last: ExerciseResult,
  lastPrescription: TimedHoldPrescription,
): AdaptationOutcome => {
  const { holdSec } = lastPrescription;
  const addedWeight = priorLoad(lastPrescription, unit);
  const at = (nextHold: number, nextWeight: number): Prescription =>
    Rx.TimedHold({
      ...(nextWeight > 0 ? { addedWeight: nextWeight } : {}),
      holdSec: nextHold,
      sets: policy.sets,
      unit,
    });

  if (!metHoldTarget(last)) {
    return {
      action: "repeat",
      details: { holdSec },
      explanation: `Repeat ${holdSec}s holds: last session's holds weren't completed.`,
      prescription: at(holdSec, addedWeight),
    };
  } else if (holdSec >= policy.addWeightAfterSec) {
    const step = loadStep(unit);
    const weight = addedWeight + step;
    return {
      action: "increase-load",
      details: { addedWeight: weight, holdSec },
      explanation: `Hold at ${holdSec}s and add ${step} ${unit} (to ${weight} ${unit}): the duration ceiling is reached.`,
      prescription: at(holdSec, weight),
    };
  } else {
    const next = holdSec + policy.holdIncrementSec;
    return {
      action: "increase-duration",
      details: { fromSec: holdSec, toSec: next },
      explanation: `Extend planks from ${holdSec}s to ${next}s.`,
      prescription: at(next, addedWeight),
    };
  }
};

/** The last hold's added load in `unit`, re-gridded when it was stored in the
 *  other unit. */
const priorLoad = (
  prescription: TimedHoldPrescription,
  unit: LoadUnit,
): number => {
  const load = prescription.addedWeight ?? 0;
  return prescription.unit === unit
    ? load
    : roundLoad(unit === "kg" ? lbToKg(load) : kgToLb(load), unit);
};
