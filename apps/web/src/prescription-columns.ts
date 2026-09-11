import type { LoadUnit } from "@titan/domain/load-unit";
import type { Prescription } from "@titan/domain/prescription";
import {
  formatDistance,
  formatMinutes,
  formatSplit,
  formatWeight,
} from "./format";

/** A prescription's target laid out as the redesigned grid's two figure
 *  columns: the set/rep (or distance/duration) `scheme` on the left and the
 *  `load` on the right. `load` is `undefined` when a piece has nothing to put
 *  there — an untargeted distance row leaves the column empty rather than
 *  inventing a value. */
export type PrescriptionColumns = {
  load: string | undefined;
  scheme: string;
};

/** An optional added-load suffix (` +10 kg`), or the empty string when a
 *  movement carries no extra weight. */
const addedLoad = (added: number | undefined, unit: LoadUnit): string =>
  added === undefined || added === 0 ? "" : ` +${added} ${unit}`;

/**
 * Split a prescription into the ledger grid's `scheme` and `load` columns. Pure
 * and exhaustive over prescription types; reuses the shared unit formatters so
 * figures read identically across the app.
 */
export const prescriptionColumns = (
  prescription: Prescription,
): PrescriptionColumns => {
  switch (prescription.type) {
    case "strength": {
      return {
        load: formatWeight(prescription.weight, prescription.unit),
        scheme: `${prescription.sets}×${prescription.reps}`,
      };
    }
    case "bodyweight": {
      const added = addedLoad(prescription.addedWeight, prescription.unit);
      return {
        load: added === "" ? "Bodyweight" : added.trimStart(),
        scheme: `${prescription.sets}×${prescription.reps}`,
      };
    }
    case "timed-hold": {
      return {
        load: `${prescription.holdSec}s hold${addedLoad(prescription.addedWeightLb, "lb")}`,
        scheme: `${prescription.sets}×`,
      };
    }
    case "timed-carry": {
      return {
        load: formatWeight(prescription.weight, prescription.unit),
        scheme: `${prescription.sets} × ${prescription.durationSec} sec`,
      };
    }
    case "timed-cardio": {
      return {
        load:
          prescription.targetHrZone === undefined
            ? undefined
            : `Zone ${prescription.targetHrZone}`,
        scheme: formatMinutes(prescription.durationSec / 60),
      };
    }
    case "distance-cardio": {
      return {
        load:
          prescription.targetSplitSecPer500 === undefined
            ? undefined
            : formatSplit(prescription.targetSplitSecPer500),
        scheme: formatDistance(prescription.distanceMeters),
      };
    }
    case "intervals": {
      const work =
        prescription.workDistanceMeters === undefined
          ? `${prescription.workSec ?? 0}s`
          : formatDistance(prescription.workDistanceMeters);
      return {
        load:
          prescription.targetSplitSecPer500 === undefined
            ? undefined
            : formatSplit(prescription.targetSplitSecPer500),
        scheme: `${prescription.count} × ${work}`,
      };
    }
    case "circuit": {
      return {
        load: `${prescription.stations.length} stations`,
        scheme: `${prescription.rounds} rounds`,
      };
    }
  }
};
