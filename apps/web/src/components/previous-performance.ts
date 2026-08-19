import type {
  BodyweightPrescription,
  StrengthPrescription,
  TimedHoldPrescription,
} from "@titan/domain/prescription";
import type { ExerciseResult, SetResult } from "@titan/domain/result";
import { formatWeight } from "../format";

/**
 * The "last time" line for the exercise now on screen: what the athlete's best
 * working set was in their most recent session for this slot, phrased for the
 * kind of movement it is.
 *
 * The metric is read from the source the progression engine itself trusts —
 * reps and hold time from the logged set, and *added* load from the result's
 * prescription snapshot (see `adaptation-engine` `readLoad`). A bodyweight
 * set's `weight` field is never surfaced: it is not a real load (there is no
 * weight input for bodyweight work) and can carry a stray value, so reporting
 * it would show a load the athlete never lifted.
 *
 * Returns `undefined` when there is nothing meaningful to show — an empty
 * history, a cardio-style result with no per-set metric, or a strength result
 * whose sets never recorded the load they were lifted at.
 */
export const describePreviousPerformance = (
  result: ExerciseResult,
): string | undefined => {
  const { prescription } = result;
  switch (prescription.type) {
    case "strength": {
      return strengthLine(result.sets, prescription);
    }
    case "bodyweight": {
      return bodyweightLine(result.sets, prescription);
    }
    case "timed-hold": {
      return timedHoldLine(result.sets, prescription);
    }
    case "timed-cardio":
    case "distance-cardio":
    case "intervals":
    case "circuit": {
      return undefined;
    }
  }
};

const strengthLine = (
  sets: readonly SetResult[],
  prescription: StrengthPrescription,
): string | undefined => {
  const top = topBy(
    recordedSets(sets),
    (set) => set.weight,
    (set) => set.reps,
  );
  return top === undefined
    ? undefined
    : `${top.reps} × ${formatWeight(top.weight, prescription.unit)}`;
};

/** The sets that recorded both figures a strength line reports. A set missing
 *  either one is passed over rather than completed from the prescription: the
 *  prescription is what was asked for, and reporting it as what was done would
 *  hand the athlete a number nobody lifted. */
const recordedSets = (
  sets: readonly SetResult[],
): readonly (SetResult & { reps: number; weight: number })[] =>
  sets.flatMap((set) =>
    set.reps === undefined || set.weight === undefined
      ? []
      : [{ ...set, reps: set.reps, weight: set.weight }],
  );

const bodyweightLine = (
  sets: readonly SetResult[],
  prescription: BodyweightPrescription,
): string | undefined => {
  const top = topBy(sets, (set) => set.reps ?? 0);
  return top === undefined || top.reps === undefined
    ? undefined
    : `${top.reps} reps${addedLoad(prescription.addedWeightLb)}`;
};

const timedHoldLine = (
  sets: readonly SetResult[],
  prescription: TimedHoldPrescription,
): string | undefined => {
  const top = topBy(sets, (set) => set.holdSec ?? 0);
  return top === undefined || top.holdSec === undefined
    ? undefined
    : `${top.holdSec}s${addedLoad(prescription.addedWeightLb)}`;
};

/** The ` +N lb` clause for a weighted bodyweight/hold movement, or empty when
 *  the movement carries no added load. */
const addedLoad = (addedWeightLb: number | undefined): string =>
  addedWeightLb === undefined || addedWeightLb === 0
    ? ""
    : ` +${formatWeight(addedWeightLb, "lb")}`;

/**
 * The best set by a primary metric, breaking ties with an optional secondary
 * metric (both "higher is better"). Returns `undefined` for an empty list.
 */
const topBy = <T extends SetResult>(
  sets: readonly T[],
  primary: (set: T) => number,
  secondary: (set: T) => number = () => 0,
): T | undefined =>
  sets.reduce<T | undefined>(
    (best, set) =>
      best === undefined ||
      primary(set) > primary(best) ||
      (primary(set) === primary(best) && secondary(set) > secondary(best))
        ? set
        : best,
    undefined,
  );
