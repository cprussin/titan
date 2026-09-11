import type { LoadUnit } from "@titan/domain/load-unit";
import type { Prescription } from "@titan/domain/prescription";
import { Prescription as Rx } from "@titan/domain/prescription";
import type { TimedCarryPolicy } from "@titan/domain/progression-policy";
import type { ExerciseResult } from "@titan/domain/result";
import {
  averageRpe,
  completedWeight,
  metDurationTarget,
  mostRecent,
} from "./history";
import type { AdaptationOutcome } from "./outcome";

/**
 * Timed-carry progression (farmer carry): the duration is fixed by the policy
 * and never moves — a carry gets harder by getting heavier, not longer. The base
 * load stands when there is no history, and equally when the last session was
 * logged against some other shape — carries recorded before the movement was
 * prescribed by time hold reps, not seconds, so there is nothing in them to
 * judge a duration against. Otherwise, judged against the last session:
 *
 * - every carry held for the full duration at or below the RPE cap → add
 *   `increment`
 * - every carry held but the RPE ran over the cap → repeat the load
 * - a carry cut short → repeat the load
 *
 * Repeating rather than deloading on a miss is deliberate: a carry is missed
 * when posture or grip gives out, and the answer to that is another session at
 * the same load, not a lighter one.
 */
export const progressTimedCarry = (
  policy: TimedCarryPolicy,
  base: Prescription,
  priorResults: readonly ExerciseResult[],
): AdaptationOutcome => {
  if (base.type === "timed-carry") {
    const last = mostRecent(priorResults);
    return last === undefined || last.prescription.type !== "timed-carry"
      ? {
          action: "maintain",
          explanation: `Starting at ${base.weight} ${base.unit} for ${policy.sets}×${policy.durationSec} sec.`,
          prescription: base,
        }
      : decideFromLast(policy, base.unit, last);
  } else {
    throw new Error(
      `timed-carry policy requires a timed-carry base, got ${base.type}`,
    );
  }
};

const decideFromLast = (
  policy: TimedCarryPolicy,
  unit: LoadUnit,
  last: ExerciseResult,
): AdaptationOutcome => {
  const lastWeight = completedWeight(last);
  const rpe = averageRpe(last);
  const at = (weight: number): Prescription =>
    Rx.TimedCarry({
      durationSec: policy.durationSec,
      sets: policy.sets,
      unit,
      weight,
    });

  if (!metDurationTarget(last)) {
    return {
      action: "repeat",
      details: { weight: lastWeight },
      explanation: `Repeat ${lastWeight} ${unit}: last session's carries didn't hold the full ${policy.durationSec} sec.`,
      prescription: at(lastWeight),
    };
  } else if (rpe !== undefined && rpe > policy.rpeCap) {
    return {
      action: "repeat",
      details: { avgRpe: rpe, rpeCap: policy.rpeCap, weight: lastWeight },
      explanation: `Repeat ${lastWeight} ${unit}: every carry held but average RPE ${round1(rpe)} exceeded the ${policy.rpeCap} cap.`,
      prescription: at(lastWeight),
    };
  } else {
    const next = lastWeight + policy.increment;
    return {
      action: "increase-load",
      details: { from: lastWeight, increment: policy.increment, to: next },
      explanation: `Increase from ${lastWeight} ${unit} to ${next} ${unit}: every carry held the full ${policy.durationSec} sec with control.`,
      prescription: at(next),
    };
  }
};

const round1 = (value: number): number => Math.round(value * 10) / 10;
