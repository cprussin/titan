import type { Prescription } from "@titan/domain/prescription";
import {
  formatClock,
  formatDistance,
  formatMinutes,
  formatSplit,
  formatWeight,
} from "./format";

/** A prescription's target split into its main line and an optional recovery
 *  clause, so callers can lay the recovery on its own line instead of letting
 *  one row grow too wide. */
export type PrescriptionParts = {
  primary: string;
  recovery: string | undefined;
};

/**
 * The target for a prescription, as a primary line plus an optional recovery
 * clause. Pure; exhaustive over prescription types. Only interval work carries
 * a recovery clause; everything else keeps its whole target on `primary`.
 */
export const prescriptionParts = (
  prescription: Prescription,
): PrescriptionParts => {
  switch (prescription.type) {
    case "strength": {
      return {
        primary: `${prescription.sets}×${prescription.reps} @ ${formatWeight(prescription.weight, prescription.unit)}`,
        recovery: undefined,
      };
    }
    case "bodyweight": {
      const added =
        prescription.addedWeightLb === undefined ||
        prescription.addedWeightLb === 0
          ? ""
          : ` +${prescription.addedWeightLb} lb`;
      return {
        primary: `${prescription.sets}×${prescription.reps}${added}`,
        recovery: undefined,
      };
    }
    case "timed-hold": {
      const added =
        prescription.addedWeightLb === undefined ||
        prescription.addedWeightLb === 0
          ? ""
          : ` +${prescription.addedWeightLb} lb`;
      return {
        primary: `${prescription.sets}× ${prescription.holdSec}s hold${added}`,
        recovery: undefined,
      };
    }
    case "timed-cardio": {
      const zone =
        prescription.targetHrZone === undefined
          ? ""
          : ` · Zone ${prescription.targetHrZone}`;
      return {
        primary: `${formatMinutes(prescription.durationSec / 60)}${zone}`,
        recovery: undefined,
      };
    }
    case "distance-cardio": {
      const split =
        prescription.targetSplitSecPer500 === undefined
          ? ""
          : ` @ ${formatSplit(prescription.targetSplitSecPer500)}`;
      return {
        primary: `${formatDistance(prescription.distanceMeters)}${split}`,
        recovery: undefined,
      };
    }
    case "intervals": {
      const work =
        prescription.workDistanceMeters === undefined
          ? `${prescription.workSec ?? 0}s`
          : formatDistance(prescription.workDistanceMeters);
      const split =
        prescription.targetSplitSecPer500 === undefined
          ? ""
          : ` @ ${formatSplit(prescription.targetSplitSecPer500)}`;
      return {
        primary: `${prescription.count} × ${work}${split}`,
        recovery: `${formatClock(prescription.recoverySec)} recovery`,
      };
    }
    case "circuit": {
      return {
        primary: `${prescription.rounds} rounds · ${prescription.stations.length} stations · ${formatClock(prescription.restSec)} rest`,
        recovery: undefined,
      };
    }
  }
};

/**
 * A one-line, human-readable target for a prescription — the recovery clause,
 * when present, is joined back on with a separator. Prefer {@link
 * prescriptionParts} where a row can show the recovery on its own line.
 */
export const describePrescription = (prescription: Prescription): string => {
  const { primary, recovery } = prescriptionParts(prescription);
  return recovery === undefined ? primary : `${primary} · ${recovery}`;
};
