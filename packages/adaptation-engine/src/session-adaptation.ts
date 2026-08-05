import type { Prescription } from "@titan/domain/prescription";
import { Prescription as Rx } from "@titan/domain/prescription";
import type { ReadinessEntry } from "@titan/domain/readiness";
import type { PrescribedExercise } from "@titan/domain/workout-session";
import { estimatePlanMinutes } from "./estimate-duration";
import type { AdaptationNote } from "./note";

/** Energy/soreness at or below this (1–5) counts as low readiness. */
const LOW_READINESS_THRESHOLD = 2;

/** The output of session adaptation: the adjusted plan and the notes explaining
 *  every change. */
export type SessionAdaptation = {
  notes: readonly AdaptationNote[];
  plan: readonly PrescribedExercise[];
};

/**
 * The **session-adaptation layer**. Given the resolved plan and today's
 * readiness, trim the session to fit the available time and the athlete's state:
 *
 * - The primary movement is always preserved.
 * - Accessories are removed first — to fit the clock, and again (all of them)
 *   when readiness is low.
 * - Only once accessories are gone is intensity reduced, by trimming a set from
 *   a secondary movement.
 * - Nothing is ever made harder, no matter how good readiness is.
 */
export const adaptSession = (
  plan: readonly PrescribedExercise[],
  readiness: ReadinessEntry,
): SessionAdaptation => {
  const lowReadiness =
    readiness.energy <= LOW_READINESS_THRESHOLD ||
    readiness.soreness <= LOW_READINESS_THRESHOLD;
  const timeTrimmed = trimAccessoriesForTime(
    plan,
    readiness.availableMinutes,
    [],
  );
  const readinessTrimmed = lowReadiness
    ? shedRemainingAccessories(timeTrimmed, readiness)
    : timeTrimmed;
  return reduceSecondaryIntensity(readinessTrimmed, readiness.availableMinutes);
};

const trimAccessoriesForTime = (
  plan: readonly PrescribedExercise[],
  availableMinutes: number,
  notes: readonly AdaptationNote[],
): SessionAdaptation => {
  if (estimatePlanMinutes(plan) <= availableMinutes) {
    return { notes, plan };
  } else {
    const lastAccessory = lastIndex(plan, (item) => item.role === "accessory");
    if (lastAccessory === -1) {
      return { notes, plan };
    } else {
      const removed = plan[lastAccessory];
      return trimAccessoriesForTime(
        plan.filter((_, index) => index !== lastAccessory),
        availableMinutes,
        [
          ...notes,
          {
            action: "remove-accessory",
            details: { availableMinutes },
            explanation: `Removed accessory ${removed?.exerciseId} to fit the ${availableMinutes} min available.`,
          },
        ],
      );
    }
  }
};

const shedRemainingAccessories = (
  current: SessionAdaptation,
  readiness: ReadinessEntry,
): SessionAdaptation => {
  const accessories = current.plan.filter((item) => item.role === "accessory");
  return accessories.length === 0
    ? current
    : {
        notes: [
          ...current.notes,
          ...accessories.map(
            (item): AdaptationNote => ({
              action: "remove-accessory",
              details: {
                energy: readiness.energy,
                soreness: readiness.soreness,
              },
              explanation: `Removed accessory ${item.exerciseId} to reduce workload given low readiness (energy ${readiness.energy}, soreness ${readiness.soreness}).`,
            }),
          ),
        ],
        plan: current.plan.filter((item) => item.role !== "accessory"),
      };
};

const reduceSecondaryIntensity = (
  current: SessionAdaptation,
  availableMinutes: number,
): SessionAdaptation => {
  if (estimatePlanMinutes(current.plan) <= availableMinutes) {
    return current;
  } else {
    const target = current.plan.findIndex(
      (item) =>
        item.role === "secondary" &&
        trimOneSet(item.prescription) !== undefined,
    );
    if (target === -1) {
      return current;
    } else {
      const item = current.plan[target];
      const trimmed =
        item === undefined ? undefined : trimOneSet(item.prescription);
      if (item === undefined || trimmed === undefined) {
        return current;
      } else {
        return reduceSecondaryIntensity(
          {
            notes: [
              ...current.notes,
              {
                action: "reduce-intensity",
                explanation: `Trimmed a set from secondary ${item.exerciseId} to fit the available time.`,
              },
            ],
            plan: current.plan.map((planItem, index) =>
              index === target
                ? { ...planItem, prescription: trimmed }
                : planItem,
            ),
          },
          availableMinutes,
        );
      }
    }
  }
};

/** Drop one working set from a rep-based prescription; `undefined` if it can't
 *  be trimmed (single set, or not a set-based movement). */
const trimOneSet = (prescription: Prescription): Prescription | undefined => {
  switch (prescription.type) {
    case "strength": {
      return prescription.sets > 1
        ? Rx.Strength({ ...prescription, sets: prescription.sets - 1 })
        : undefined;
    }
    case "bodyweight": {
      return prescription.sets > 1
        ? Rx.Bodyweight({ ...prescription, sets: prescription.sets - 1 })
        : undefined;
    }
    case "timed-hold": {
      return prescription.sets > 1
        ? Rx.TimedHold({ ...prescription, sets: prescription.sets - 1 })
        : undefined;
    }
    case "timed-cardio":
    case "distance-cardio":
    case "intervals":
    case "circuit": {
      return undefined;
    }
  }
};

const lastIndex = <T>(
  items: readonly T[],
  predicate: (item: T) => boolean,
): number => {
  const reversedIndex = [...items].reverse().findIndex(predicate);
  return reversedIndex === -1 ? -1 : items.length - 1 - reversedIndex;
};
