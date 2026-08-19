import type { LoadUnit } from "@titan/domain/load-unit";
import type {
  CardioResult,
  ExerciseResult,
  SetResult,
} from "@titan/domain/result";
import {
  formatDistance,
  formatDuration,
  formatSplit,
  formatWeight,
} from "./format";

/** One line in a completed exercise's recap: a set label (`Set 2`, or empty for
 *  a single cardio effort) beside the work logged against it (`5 × 225 lb`). */
export type LoggedLine = {
  label: string;
  value: string;
};

/** The parts of an {@link ExerciseResult} a recap reads: the prescription the
 *  work was measured against and the work itself. Kept narrower than the whole
 *  result so a session still in progress — which has logged sets but no result
 *  yet — can be described the same way. */
export type LoggedWork = Pick<ExerciseResult, "cardio" | "prescription"> & {
  sets: readonly SetResult[];
};

/**
 * The recap lines for one logged exercise — a labelled line per set for
 * strength, bodyweight, and timed-hold work, or a single effort summary for a
 * cardio piece. Pure; the caller supplies the exercise name and renders the
 * lines. Branches on the result's snapshot prescription so a bodyweight set's
 * placeholder zero load reads as reps rather than "× 0 lb".
 */
export const loggedExerciseLines = (work: LoggedWork): LoggedLine[] => {
  const { prescription } = work;
  switch (prescription.type) {
    case "strength": {
      return setLines(work.sets, (each) =>
        strengthSet(each, prescription.unit),
      );
    }
    case "bodyweight": {
      return setLines(work.sets, repSet);
    }
    case "timed-hold": {
      return setLines(work.sets, holdSet);
    }
    case "timed-cardio":
    case "distance-cardio":
    case "intervals":
    case "circuit": {
      return [{ label: "", value: cardioSummary(work.cardio) }];
    }
  }
};

/** Pair each logged set with its `Set N` label and a formatted value. */
const setLines = (
  sets: readonly SetResult[],
  describe: (set: SetResult) => string,
): LoggedLine[] =>
  sets.map((set, index) => ({
    label: `Set ${index + 1}`,
    value: describe(set),
  }));

const strengthSet = (set: SetResult, unit: LoadUnit): string =>
  `${requireField(set.reps, "reps")} × ${formatWeight(requireField(set.weight, "weight"), unit)}`;

const repSet = (set: SetResult): string =>
  `${requireField(set.reps, "reps")} reps`;

const holdSet = (set: SetResult): string =>
  `${requireField(set.holdSec, "holdSec")}s hold`;

/** A cardio effort as its recorded optics — distance, duration, split, average
 *  heart rate — most-summary-first and `·`-joined, or an em dash when nothing
 *  was recorded. */
const cardioSummary = (cardio: CardioResult | undefined): string => {
  if (cardio === undefined) {
    throw new Error("a cardio exercise result is missing its effort summary");
  } else {
    const parts = [
      cardio.distanceMeters === undefined
        ? undefined
        : formatDistance(cardio.distanceMeters),
      cardio.durationSec === undefined
        ? undefined
        : formatDuration(cardio.durationSec),
      cardio.splitSecPer500 === undefined
        ? undefined
        : formatSplit(cardio.splitSecPer500),
      cardio.avgHr === undefined ? undefined : `${cardio.avgHr} bpm`,
    ].filter((part) => part !== undefined);
    return parts.length === 0 ? "—" : parts.join(" · ");
  }
};

/** A numeric field a logged set of its kind must carry; its absence is an
 *  invariant violation (a corrupt result), not a display state. */
const requireField = (value: number | undefined, name: string): number => {
  if (value === undefined) {
    throw new Error(`logged set is missing its ${name}`);
  } else {
    return value;
  }
};
