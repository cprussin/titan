import type { ExerciseResult } from "@titan/domain/result";

/**
 * Helpers for reading an exercise's recorded history. `priorResults` is always
 * ordered oldest → newest, so "most recent" is the last element. Each helper
 * judges a result against the prescription it was *actually measured against*
 * (the snapshot on the result), never against the current base — a session that
 * met a lighter old target still counts as met.
 */

/** The most recent recorded result, or `undefined` when there is no history. */
export const mostRecent = (
  priorResults: readonly ExerciseResult[],
): ExerciseResult | undefined => priorResults.at(-1);

/**
 * The RPE logged on the final working set (the highest `setIndex`), or
 * `undefined` when that set logged none. RPE-banded progression gates on the
 * final set specifically — the last set is where effort is judged — so this is
 * deliberately not the average.
 */
export const finalSetRpe = (result: ExerciseResult): number | undefined => {
  const finalSet = [...result.sets]
    .sort((a, b) => a.setIndex - b.setIndex)
    .at(-1);
  return finalSet?.rpe;
};

/** Average RPE across the sets that logged one, or `undefined` if none did. */
export const averageRpe = (result: ExerciseResult): number | undefined => {
  const rpes = result.sets
    .map((set) => set.rpe)
    .filter((rpe): rpe is number => rpe !== undefined);
  return rpes.length === 0
    ? undefined
    : rpes.reduce((sum, rpe) => sum + rpe, 0) / rpes.length;
};

/**
 * Whether every prescribed set of a strength/bodyweight result was completed at
 * or above its prescribed reps. Throws if the snapshot isn't rep-based — a
 * caller mismatched a policy to a prescription type (an invariant bug).
 */
export const metRepTarget = (result: ExerciseResult): boolean => {
  const { prescription } = result;
  if (prescription.type !== "strength" && prescription.type !== "bodyweight") {
    throw new Error(
      `metRepTarget expects a rep-based prescription, got ${prescription.type}`,
    );
  } else {
    return countCompletedTargetSets(result) >= prescription.sets;
  }
};

/** Whether every prescribed set of a timed-hold result met its hold duration. */
export const metHoldTarget = (result: ExerciseResult): boolean => {
  const { prescription, sets } = result;
  if (prescription.type === "timed-hold") {
    const held = sets.filter(
      (set) => set.completed && (set.holdSec ?? 0) >= prescription.holdSec,
    ).length;
    return held >= prescription.sets;
  } else {
    throw new Error(
      `metHoldTarget expects a timed-hold prescription, got ${prescription.type}`,
    );
  }
};

/**
 * The length of the trailing streak of results that did NOT meet their rep
 * target — used by linear progression to decide when misses warrant a deload.
 */
export const trailingMissStreak = (
  priorResults: readonly ExerciseResult[],
): number => {
  const misses = [...priorResults]
    .reverse()
    .findIndex((result) => metRepTarget(result));
  return misses === -1 ? priorResults.length : misses;
};

const countCompletedTargetSets = (result: ExerciseResult): number => {
  const { prescription, sets } = result;
  if (prescription.type !== "strength" && prescription.type !== "bodyweight") {
    throw new Error(
      `countCompletedTargetSets expects a rep-based prescription, got ${prescription.type}`,
    );
  } else {
    return sets.filter(
      (set) => set.completed && (set.reps ?? 0) >= prescription.reps,
    ).length;
  }
};
