import type { LoadUnit } from "@titan/domain/load-unit";
import type { Prescription } from "@titan/domain/prescription";
import { Prescription as Rx } from "@titan/domain/prescription";
import type { LinearPolicy } from "@titan/domain/progression-policy";
import type { ExerciseResult } from "@titan/domain/result";
import {
  averageRpe,
  metRepTarget,
  mostRecent,
  trailingMissStreak,
} from "./history";
import type { AdaptationOutcome } from "./outcome";
import { roundLoad } from "./round-load";

/**
 * Linear progression (the 5×5 policy). With no history, the base weight stands.
 * Otherwise, judged against the last session:
 *
 * - all reps completed, average RPE ≤ cap → add `increment`
 * - all reps completed, RPE above cap → repeat the weight
 * - reps missed, but the miss streak is below `missesBeforeDeload` → repeat
 * - reps missed for `missesBeforeDeload` straight sessions → deload to
 *   `weight × retainOnDeload`
 *
 * Load math stays in the exercise's unit (kg for barbell, else lb); every
 * branch returns a decision the caller records verbatim.
 */
export const progressLinear = (
  policy: LinearPolicy,
  base: Prescription,
  priorResults: readonly ExerciseResult[],
): AdaptationOutcome => {
  if (base.type === "strength") {
    const last = mostRecent(priorResults);
    return last === undefined
      ? {
          action: "maintain",
          explanation: `Starting Week 1 at ${base.weight} ${base.unit} for ${policy.sets}×${policy.reps}.`,
          prescription: base,
        }
      : decideFromLast(policy, base.unit, last, priorResults);
  } else {
    throw new Error(`linear policy requires a strength base, got ${base.type}`);
  }
};

const decideFromLast = (
  policy: LinearPolicy,
  unit: LoadUnit,
  last: ExerciseResult,
  priorResults: readonly ExerciseResult[],
): AdaptationOutcome => {
  const lastWeight = lastStrengthWeight(last);
  const rpe = averageRpe(last);
  const at = (weight: number): Prescription =>
    Rx.Strength({
      reps: policy.reps,
      rpeTarget: policy.rpeCap,
      sets: policy.sets,
      unit,
      weight,
    });

  if (metRepTarget(last)) {
    return rpe !== undefined && rpe > policy.rpeCap
      ? {
          action: "repeat",
          details: { avgRpe: rpe, rpeCap: policy.rpeCap, weight: lastWeight },
          explanation: `Repeat ${lastWeight} ${unit}: all reps completed but average RPE ${round1(rpe)} exceeded the ${policy.rpeCap} cap.`,
          prescription: at(lastWeight),
        }
      : increase(policy, unit, lastWeight, rpe, at);
  } else {
    return decideMiss(policy, unit, lastWeight, priorResults, at);
  }
};

const increase = (
  policy: LinearPolicy,
  unit: LoadUnit,
  lastWeight: number,
  rpe: number | undefined,
  at: (weight: number) => Prescription,
): AdaptationOutcome => {
  const next = lastWeight + policy.increment;
  const rpeClause =
    rpe === undefined
      ? "all prescribed reps were completed"
      : `all prescribed reps were completed at an average RPE of ${round1(rpe)}`;
  return {
    action: "increase-load",
    details: {
      from: lastWeight,
      increment: policy.increment,
      to: next,
    },
    explanation: `Increase from ${lastWeight} ${unit} to ${next} ${unit} because ${rpeClause}.`,
    prescription: at(next),
  };
};

const decideMiss = (
  policy: LinearPolicy,
  unit: LoadUnit,
  lastWeight: number,
  priorResults: readonly ExerciseResult[],
  at: (weight: number) => Prescription,
): AdaptationOutcome => {
  const misses = trailingMissStreak(priorResults);
  if (misses >= policy.missesBeforeDeload) {
    const deloaded = roundLoad(lastWeight * policy.retainOnDeload, unit);
    return {
      action: "deload",
      details: { from: lastWeight, misses, to: deloaded },
      explanation: `Deload from ${lastWeight} ${unit} to ${deloaded} ${unit} after ${misses} consecutive missed sessions.`,
      prescription: at(deloaded),
    };
  } else {
    return {
      action: "repeat",
      details: { misses, weight: lastWeight },
      explanation: `Repeat ${lastWeight} ${unit}: reps missed last session (${misses} in a row), holding before a deload.`,
      prescription: at(lastWeight),
    };
  }
};

const lastStrengthWeight = (result: ExerciseResult): number => {
  if (result.prescription.type === "strength") {
    return result.prescription.weight;
  } else {
    throw new Error(
      `linear history expects strength prescriptions, got ${result.prescription.type}`,
    );
  }
};

const round1 = (value: number): number => Math.round(value * 10) / 10;
