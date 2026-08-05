import type { Prescription } from "@titan/domain/prescription";
import { Prescription as Rx } from "@titan/domain/prescription";
import type { Zone2Policy } from "@titan/domain/progression-policy";
import type { ExerciseResult } from "@titan/domain/result";
import { mostRecent } from "./history";
import type { AdaptationOutcome } from "./outcome";

/**
 * Zone 2 progression: increase *duration* toward the cap, then hold. Intensity
 * (heart-rate zone, stroke rate) is never raised — that is a hard rule of the
 * policy (see the spec's "Zone 2 Row"). The base carries the intensity targets;
 * only `durationSec` changes.
 */
export const progressZone2 = (
  policy: Zone2Policy,
  base: Prescription,
  priorResults: readonly ExerciseResult[],
): AdaptationOutcome => {
  if (base.type === "timed-cardio") {
    const last = mostRecent(priorResults);
    if (last === undefined) {
      return {
        action: "maintain",
        explanation: `Starting the Zone 2 row at ${minutes(base.durationSec)}.`,
        prescription: base,
      };
    } else {
      return advance(policy, base, last);
    }
  } else {
    throw new Error(
      `zone2 policy requires a timed-cardio base, got ${base.type}`,
    );
  }
};

const advance = (
  policy: Zone2Policy,
  base: Extract<Prescription, { type: "timed-cardio" }>,
  last: ExerciseResult,
): AdaptationOutcome => {
  const currentDuration =
    last.prescription.type === "timed-cardio"
      ? last.prescription.durationSec
      : base.durationSec;
  const at = (durationSec: number): Prescription =>
    Rx.TimedCardio({ ...base, durationSec });

  if (currentDuration < policy.maxDurationSec) {
    const next = Math.min(
      currentDuration + policy.durationIncrementSec,
      policy.maxDurationSec,
    );
    return {
      action: "increase-duration",
      details: { fromSec: currentDuration, toSec: next },
      explanation: `Extend the row from ${minutes(currentDuration)} to ${minutes(next)} at the same easy Zone 2 effort.`,
      prescription: at(next),
    };
  } else {
    return {
      action: "maintain",
      details: { durationSec: policy.maxDurationSec },
      explanation: `Hold at ${minutes(policy.maxDurationSec)}: duration cap reached, intensity stays easy.`,
      prescription: at(policy.maxDurationSec),
    };
  }
};

const minutes = (seconds: number): string => `${Math.round(seconds / 60)} min`;
