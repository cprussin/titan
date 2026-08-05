import type { Prescription } from "@titan/domain/prescription";
import {
  formatClock,
  formatDistance,
  formatMinutes,
  formatSplit,
  formatWeight,
} from "./format";

/**
 * A one-line, human-readable target for a prescription — the text shown on the
 * dashboard and during execution. Pure; exhaustive over prescription types.
 */
export const describePrescription = (prescription: Prescription): string => {
  switch (prescription.type) {
    case "strength": {
      return `${prescription.sets}×${prescription.reps} @ ${formatWeight(prescription.weightLb)}`;
    }
    case "bodyweight": {
      const added =
        prescription.addedWeightLb === undefined ||
        prescription.addedWeightLb === 0
          ? ""
          : ` +${prescription.addedWeightLb} lb`;
      return `${prescription.sets}×${prescription.reps}${added}`;
    }
    case "timed-hold": {
      const added =
        prescription.addedWeightLb === undefined ||
        prescription.addedWeightLb === 0
          ? ""
          : ` +${prescription.addedWeightLb} lb`;
      return `${prescription.sets}× ${prescription.holdSec}s hold${added}`;
    }
    case "timed-cardio": {
      const zone =
        prescription.targetHrZone === undefined
          ? ""
          : ` · Zone ${prescription.targetHrZone}`;
      return `${formatMinutes(prescription.durationSec / 60)}${zone}`;
    }
    case "distance-cardio": {
      const split =
        prescription.targetSplitSecPer500 === undefined
          ? ""
          : ` @ ${formatSplit(prescription.targetSplitSecPer500)}`;
      return `${formatDistance(prescription.distanceMeters)}${split}`;
    }
    case "intervals": {
      return describeIntervals(prescription);
    }
    case "circuit": {
      return `${prescription.rounds} rounds · ${prescription.stations.length} stations · ${formatClock(prescription.restSec)} rest`;
    }
  }
};

const describeIntervals = (
  prescription: Extract<Prescription, { type: "intervals" }>,
): string => {
  const work =
    prescription.workDistanceMeters === undefined
      ? `${prescription.workSec ?? 0}s`
      : formatDistance(prescription.workDistanceMeters);
  const split =
    prescription.targetSplitSecPer500 === undefined
      ? ""
      : ` @ ${formatSplit(prescription.targetSplitSecPer500)}`;
  return `${prescription.count} × ${work}${split} · ${formatClock(prescription.recoverySec)} recovery`;
};
