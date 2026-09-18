import type { BandLevel } from "@titan/domain/band";
import type { Prescription } from "@titan/domain/prescription";
import type { SetResult } from "@titan/domain/result";

/** Prefill values for the set the athlete is about to log. Weight carries the
 *  last set forward (load rarely changes between sets); reps and timed seconds
 *  always reset to the prescribed target rather than tracking what fatigue
 *  actually produced. */

/** The weight to prefill for the next set: the most recently logged set's load
 *  carries forward, falling back to the prescription's target for the first
 *  set (or a movement with no load). */
export const nextSetWeight = (
  prescription: Prescription,
  logged: readonly SetResult[],
): number => logged.at(-1)?.weight ?? prescribedWeight(prescription);

/** The seconds to prefill for every timed set — always the prescribed target: a
 *  hold's duration, a carry's, or a conditioning bout's work time. Rep-based
 *  work and cardio pieces have none. */
export const nextSetSeconds = (prescription: Prescription): number => {
  switch (prescription.type) {
    case "timed-hold": {
      return prescription.holdSec;
    }
    case "timed-carry": {
      return prescription.durationSec;
    }
    case "timed-effort": {
      return prescription.workSec;
    }
    case "strength":
    case "bodyweight":
    case "band":
    case "timed-cardio":
    case "distance-cardio":
    case "intervals":
    case "circuit": {
      return 0;
    }
  }
};

/** The rep count to prefill for every set — always the prescribed target. */
export const nextSetReps = (prescription: Prescription): number =>
  isRepBased(prescription) ? prescription.reps : 0;

/** The bands to prefill for the next set: the ones the most recently logged set
 *  was worked against, since the athlete rarely changes band mid-exercise.
 *  `undefined` for the first set, and for a set the athlete logged without
 *  recording its bands — there is nothing to carry forward, and a band is never
 *  guessed on their behalf. */
export const nextSetBands = (
  logged: readonly SetResult[],
): readonly BandLevel[] | undefined => logged.at(-1)?.bands;

const isRepBased = (
  prescription: Prescription,
): prescription is Extract<
  Prescription,
  { type: "strength" | "bodyweight" | "band" }
> =>
  prescription.type === "strength" ||
  prescription.type === "bodyweight" ||
  prescription.type === "band";

const prescribedWeight = (prescription: Prescription): number =>
  prescription.type === "strength" || prescription.type === "timed-carry"
    ? prescription.weight
    : 0;
