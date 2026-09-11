import type { Prescription } from "@titan/domain/prescription";

/**
 * The prescription shapes the athlete logs set by set — the weight-room work,
 * as opposed to a cardio piece recorded as a single effort when it ends. A
 * timed carry belongs here alongside reps and holds: it is worked in sets, it
 * is just measured in seconds rather than reps.
 */
export type SetBasedPrescription = Extract<
  Prescription,
  { type: "strength" | "bodyweight" | "timed-hold" | "timed-carry" }
>;

/** Whether a prescription is worked (and logged) set by set. */
export const isSetBased = (
  prescription: Prescription,
): prescription is SetBasedPrescription =>
  prescription.type === "strength" ||
  prescription.type === "bodyweight" ||
  prescription.type === "timed-hold" ||
  prescription.type === "timed-carry";
