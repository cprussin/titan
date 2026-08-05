import type { Prescription } from "@titan/domain/prescription";
import type { PrescribedExercise } from "@titan/domain/workout-session";

/** Minutes budgeted per working set of a strength / bodyweight / hold movement,
 *  including rest. A coarse planning constant, not a stopwatch. */
const MINUTES_PER_SET = 2.5;
/** Assumed easy-row split (sec/500m) used to size distance and interval work
 *  when no explicit target is given. */
const DEFAULT_SPLIT_SEC_PER_500 = 135;
/** Minutes budgeted per circuit station (movement + transition). */
const MINUTES_PER_STATION = 0.75;
/** Fixed setup/transition overhead added to a continuous cardio effort. */
const CARDIO_SETUP_MIN = 2;

/**
 * A rough estimate of how long a single prescription takes, in minutes. Used to
 * size a session for the dashboard and to decide how much to shed under a time
 * constraint. Deterministic and intentionally simple.
 */
export const estimatePrescriptionMinutes = (
  prescription: Prescription,
): number => {
  switch (prescription.type) {
    case "strength":
    case "bodyweight":
    case "timed-hold": {
      return prescription.sets * MINUTES_PER_SET;
    }
    case "timed-cardio": {
      return prescription.durationSec / 60 + CARDIO_SETUP_MIN;
    }
    case "distance-cardio": {
      const split =
        prescription.targetSplitSecPer500 ?? DEFAULT_SPLIT_SEC_PER_500;
      return (
        (prescription.distanceMeters / 500) * (split / 60) + CARDIO_SETUP_MIN
      );
    }
    case "intervals": {
      const workSec =
        prescription.workSec ??
        ((prescription.workDistanceMeters ?? 0) / 500) *
          (prescription.targetSplitSecPer500 ?? DEFAULT_SPLIT_SEC_PER_500);
      return (
        (prescription.count * (workSec + prescription.recoverySec)) / 60 +
        CARDIO_SETUP_MIN
      );
    }
    case "circuit": {
      const perRound =
        prescription.stations.length * MINUTES_PER_STATION +
        prescription.restSec / 60;
      return prescription.rounds * perRound;
    }
  }
};

/** The estimated total minutes of a resolved plan, warm-ups excluded. */
export const estimatePlanMinutes = (
  plan: readonly PrescribedExercise[],
): number =>
  plan.reduce(
    (total, item) => total + estimatePrescriptionMinutes(item.prescription),
    0,
  );
