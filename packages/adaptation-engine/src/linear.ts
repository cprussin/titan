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
 * - all reps completed, average RPE ≤ cap → add `incrementLb`
 * - all reps completed, RPE above cap → repeat the weight
 * - reps missed, but the miss streak is below `missesBeforeDeload` → repeat
 * - reps missed for `missesBeforeDeload` straight sessions → deload to
 *   `weight × retainOnDeload`
 *
 * Every branch returns a decision the caller records verbatim.
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
          explanation: `Starting Week 1 at ${base.weightLb} lb for ${policy.sets}×${policy.reps}.`,
          prescription: base,
        }
      : decideFromLast(policy, last, priorResults);
  } else {
    throw new Error(`linear policy requires a strength base, got ${base.type}`);
  }
};

const decideFromLast = (
  policy: LinearPolicy,
  last: ExerciseResult,
  priorResults: readonly ExerciseResult[],
): AdaptationOutcome => {
  const lastWeight = lastStrengthWeight(last);
  const rpe = averageRpe(last);
  const at = (weightLb: number): Prescription =>
    Rx.Strength({
      reps: policy.reps,
      rpeTarget: policy.rpeCap,
      sets: policy.sets,
      weightLb,
    });

  if (metRepTarget(last)) {
    return rpe !== undefined && rpe > policy.rpeCap
      ? {
          action: "repeat",
          details: { avgRpe: rpe, rpeCap: policy.rpeCap, weightLb: lastWeight },
          explanation: `Repeat ${lastWeight} lb: all reps completed but average RPE ${round1(rpe)} exceeded the ${policy.rpeCap} cap.`,
          prescription: at(lastWeight),
        }
      : increase(policy, lastWeight, rpe, at);
  } else {
    return decideMiss(policy, lastWeight, priorResults, at);
  }
};

const increase = (
  policy: LinearPolicy,
  lastWeight: number,
  rpe: number | undefined,
  at: (weightLb: number) => Prescription,
): AdaptationOutcome => {
  const next = lastWeight + policy.incrementLb;
  const rpeClause =
    rpe === undefined
      ? "all prescribed reps were completed"
      : `all prescribed reps were completed at an average RPE of ${round1(rpe)}`;
  return {
    action: "increase-load",
    details: {
      fromLb: lastWeight,
      incrementLb: policy.incrementLb,
      toLb: next,
    },
    explanation: `Increase from ${lastWeight} lb to ${next} lb because ${rpeClause}.`,
    prescription: at(next),
  };
};

const decideMiss = (
  policy: LinearPolicy,
  lastWeight: number,
  priorResults: readonly ExerciseResult[],
  at: (weightLb: number) => Prescription,
): AdaptationOutcome => {
  const misses = trailingMissStreak(priorResults);
  if (misses >= policy.missesBeforeDeload) {
    const deloaded = roundLoad(lastWeight * policy.retainOnDeload);
    return {
      action: "deload",
      details: { fromLb: lastWeight, misses, toLb: deloaded },
      explanation: `Deload from ${lastWeight} lb to ${deloaded} lb after ${misses} consecutive missed sessions.`,
      prescription: at(deloaded),
    };
  } else {
    return {
      action: "repeat",
      details: { misses, weightLb: lastWeight },
      explanation: `Repeat ${lastWeight} lb: reps missed last session (${misses} in a row), holding before a deload.`,
      prescription: at(lastWeight),
    };
  }
};

const lastStrengthWeight = (result: ExerciseResult): number => {
  if (result.prescription.type === "strength") {
    return result.prescription.weightLb;
  } else {
    throw new Error(
      `linear history expects strength prescriptions, got ${result.prescription.type}`,
    );
  }
};

const round1 = (value: number): number => Math.round(value * 10) / 10;
