import type { Prescription } from "@titan/domain/prescription";
import type { ProgressionPolicy } from "@titan/domain/progression-policy";
import type { ExerciseResult } from "@titan/domain/result";
import { progressAmrap } from "./amrap";
import { progressDouble } from "./double";
import { progressInterval } from "./interval";
import { progressLinear } from "./linear";
import type { AdaptationOutcome } from "./outcome";
import { progressRpeBanded } from "./rpe-banded";
import { progressTimedHold } from "./timed-hold";
import { progressZone2 } from "./zone2";

export type { AdaptationOutcome } from "./outcome";

/**
 * The **exercise-progression layer** of the adaptation engine: given a
 * progression policy, the slot's base prescription, and the athlete's recorded
 * history for that exercise (oldest → newest), produce the next prescription and
 * a recorded, explained decision.
 *
 * This is a pure, total function — every policy resolves to an
 * {@link AdaptationOutcome}. The `switch` has no `default`, so adding a policy
 * kind is a compile error until it is handled here.
 */
export const progressExercise = (
  policy: ProgressionPolicy,
  base: Prescription,
  priorResults: readonly ExerciseResult[],
): AdaptationOutcome => {
  switch (policy.kind) {
    case "linear": {
      return progressLinear(policy, base, priorResults);
    }
    case "double": {
      return progressDouble(policy, base, priorResults);
    }
    case "amrap": {
      return progressAmrap(policy, base, priorResults);
    }
    case "timed-hold": {
      return progressTimedHold(policy, base, priorResults);
    }
    case "interval": {
      return progressInterval(policy, base, priorResults);
    }
    case "zone2": {
      return progressZone2(policy, base, priorResults);
    }
    case "rpe-banded": {
      return progressRpeBanded(policy, base, priorResults);
    }
    case "none": {
      return {
        action: "maintain",
        explanation: "No automatic progression for this movement.",
        prescription: base,
      };
    }
  }
};
