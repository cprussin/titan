import type { Prescription } from "@titan/domain/prescription";
import { Prescription as Rx } from "@titan/domain/prescription";

/** Fraction of working sets kept on a deload week (~40–50% volume cut). */
const SET_RETENTION = 0.6;
/** Fraction of interval count kept on a deload week (~30% cut). */
const INTERVAL_RETENTION = 0.7;
/** Fraction of circuit rounds kept on a deload week. */
const ROUND_RETENTION = 0.6;

/**
 * The deload transform for a single prescription (see the spec's "Deload").
 * Lifting volume drops ~40–50% by cutting sets while keeping the movement and
 * load; interval volume drops ~30% by cutting the interval count; Zone 2 and
 * other steady cardio are left unchanged. Movement patterns are always
 * preserved.
 */
export const deloadPrescription = (
  prescription: Prescription,
): Prescription => {
  switch (prescription.type) {
    case "strength": {
      return Rx.Strength({
        ...prescription,
        sets: retain(prescription.sets, SET_RETENTION),
      });
    }
    case "bodyweight": {
      return Rx.Bodyweight({
        ...prescription,
        sets: retain(prescription.sets, SET_RETENTION),
      });
    }
    case "timed-hold": {
      return Rx.TimedHold({
        ...prescription,
        sets: retain(prescription.sets, SET_RETENTION),
      });
    }
    case "intervals": {
      return Rx.Intervals({
        ...prescription,
        count: retain(prescription.count, INTERVAL_RETENTION),
      });
    }
    case "circuit": {
      return Rx.Circuit({
        ...prescription,
        rounds: retain(prescription.rounds, ROUND_RETENTION),
      });
    }
    case "timed-cardio":
    case "distance-cardio": {
      // Steady easy cardio is left unchanged on a deload.
      return prescription;
    }
  }
};

const retain = (count: number, fraction: number): number =>
  Math.max(1, Math.round(count * fraction));
