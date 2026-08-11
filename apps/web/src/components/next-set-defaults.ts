import type { Prescription } from "@titan/domain/prescription";
import type { SetResult } from "@titan/domain/result";

/** Prefill values for the set the athlete is about to log. Weight carries the
 *  last set forward (load rarely changes between sets); reps always resets to
 *  the prescribed target rather than tracking what fatigue actually produced. */

/** The weight to prefill for the next set: the most recently logged set's load
 *  carries forward, falling back to the prescription's target for the first
 *  set (or a movement with no load). */
export const nextSetWeight = (
  prescription: Prescription,
  logged: readonly SetResult[],
): number => logged.at(-1)?.weight ?? prescribedWeight(prescription);

/** The rep count to prefill for every set — always the prescribed target. */
export const nextSetReps = (prescription: Prescription): number =>
  prescription.type === "strength" || prescription.type === "bodyweight"
    ? prescription.reps
    : 0;

const prescribedWeight = (prescription: Prescription): number =>
  prescription.type === "strength" ? prescription.weight : 0;
