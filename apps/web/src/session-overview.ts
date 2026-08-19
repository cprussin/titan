import type { Prescription } from "@titan/domain/prescription";
import type { ExerciseResult, SetResult } from "@titan/domain/result";
import type { PrescribedExercise } from "@titan/domain/workout-session";
import { describePrescription } from "./prescription-text";
import type { LoggedWork } from "./result-text";
import { loggedExerciseLines } from "./result-text";

/** Where an exercise sits relative to the one in progress. */
export type OverviewState = "current" | "done" | "upcoming";

/** One logged effort in the overview: the work recorded and how hard it felt. */
export type OverviewSet = {
  /** `Set 2`, or empty for a single cardio effort. */
  label: string;
  /** The recorded rating, absent for a cardio effort and for sets logged before
   *  a rating was required. */
  rpe: number | undefined;
  value: string;
};

export type OverviewExercise = {
  name: string;
  /** The work logged against this exercise so far — empty while it's upcoming. */
  sets: OverviewSet[];
  slotId: string;
  state: OverviewState;
  target: string;
};

type Args = {
  /** Position of the exercise in progress within `prescribedExercises`. */
  currentIndex: number;
  exerciseNames: Record<string, string>;
  /** The sets logged so far against the exercise in progress. */
  logged: readonly SetResult[];
  prescribedExercises: readonly PrescribedExercise[];
  /** Results for the exercises already finished, in the order they were done. */
  results: readonly ExerciseResult[];
};

/**
 * The whole session as one list: every exercise with its target, where it sits
 * relative to the one in progress, and the work logged against it — the
 * finished exercises set by set, the exercise in progress up to the last set
 * logged, and nothing yet for the ones still ahead. Pure; the caller renders it.
 */
export const sessionOverview = ({
  currentIndex,
  exerciseNames,
  logged,
  prescribedExercises,
  results,
}: Args): OverviewExercise[] =>
  prescribedExercises.map((exercise, position) => {
    const state = overviewState(position, currentIndex);
    return {
      name: exerciseNames[exercise.exerciseId] ?? exercise.exerciseId,
      sets: overviewSets(state, exercise, logged, results[position]),
      slotId: exercise.slotId,
      state,
      target: describePrescription(exercise.prescription),
    };
  });

const overviewState = (
  position: number,
  currentIndex: number,
): OverviewState => {
  switch (Math.sign(position - currentIndex)) {
    case -1: {
      return "done";
    }
    case 0: {
      return "current";
    }
    default: {
      return "upcoming";
    }
  }
};

const overviewSets = (
  state: OverviewState,
  exercise: PrescribedExercise,
  logged: readonly SetResult[],
  result: ExerciseResult | undefined,
): OverviewSet[] => {
  switch (state) {
    case "done": {
      if (result === undefined) {
        throw new Error(
          `finished exercise ${exercise.slotId} recorded no result`,
        );
      } else {
        return loggedSets(result);
      }
    }
    case "current": {
      return inProgressSets(exercise.prescription, logged);
    }
    case "upcoming": {
      return [];
    }
  }
};

/**
 * The work logged so far against the exercise in progress. Only set-by-set
 * work accumulates mid-exercise: a cardio piece records its effort in one go
 * when it ends, so until then there is nothing to show — and nothing to
 * describe it with, since the summary a cardio recap reads only exists on the
 * finished result.
 */
const inProgressSets = (
  prescription: Prescription,
  logged: readonly SetResult[],
): OverviewSet[] => {
  switch (prescription.type) {
    case "strength":
    case "bodyweight":
    case "timed-hold": {
      return loggedSets({ prescription, sets: logged });
    }
    case "timed-cardio":
    case "distance-cardio":
    case "intervals":
    case "circuit": {
      return [];
    }
  }
};

/** Pair each recap line with the rating recorded for the set it describes. A
 *  cardio effort has one line and no sets, so it carries no rating. */
const loggedSets = (work: LoggedWork): OverviewSet[] =>
  loggedExerciseLines(work).map((line, index) => ({
    label: line.label,
    rpe: work.sets[index]?.rpe,
    value: line.value,
  }));
