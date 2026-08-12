import type {
  CardioResult,
  ExerciseResult,
  SetResult,
} from "@titan/domain/result";
import type { WorkoutSession } from "@titan/domain/workout-session";
import { formatDistance, formatSplit } from "../format";
import { describePrescription } from "../prescription-text";
import { sessionDurationMin } from "../session-duration";

/** One row of the logged grid: what was prescribed, what was done, and how hard
 *  it felt. `isAsPrescribed` drives the done column's success-vs-warning tone;
 *  `isPrimary` drives the `PRIMARY` micro-label. */
export type LoggedExercise = {
  avgRpe: string | undefined;
  done: string;
  isAsPrescribed: boolean;
  isPrimary: boolean;
  name: string;
  prescribed: string;
};

/** A completed session rendered as the redesign's log: per-exercise rows, the
 *  header summary line, and the engine's adaptation notes. */
export type LoggedSessionView = {
  exercises: readonly LoggedExercise[];
  notes: readonly string[];
  summary: {
    avgRpe: string | undefined;
    exerciseCount: number;
    minutes: number;
    totalSets: number;
  };
};

/**
 * Reconstruct a completed session for the past/completed-day views: prescribed
 * versus done, average RPE, and whether each piece met its target. Pure; the
 * caller supplies the exercise names and the already-fetched adaptation notes.
 */
export const loggedSessionView = (
  session: WorkoutSession,
  names: ReadonlyMap<string, string>,
  notes: readonly string[],
): LoggedSessionView => {
  const roleBySlot = new Map(
    session.prescribedExercises.map((exercise) => [
      exercise.slotId,
      exercise.role,
    ]),
  );
  return {
    exercises: session.results.map((result) => ({
      avgRpe: averageRpe(result.sets),
      ...describeDone(result),
      isPrimary: roleBySlot.get(result.slotId) === "primary",
      name: names.get(result.exerciseId) ?? result.exerciseId,
      prescribed: describePrescription(result.prescription),
    })),
    notes,
    summary: {
      avgRpe: averageRpe(session.results.flatMap((result) => result.sets)),
      exerciseCount: session.results.length,
      minutes: sessionDurationMin(session),
      totalSets: session.results.reduce(
        (total, result) => total + result.sets.length,
        0,
      ),
    },
  };
};

/** The done column and whether it met the prescription, dispatched on the
 *  prescription type the result was measured against. */
const describeDone = (
  result: ExerciseResult,
): { done: string; isAsPrescribed: boolean } => {
  const { prescription, sets } = result;
  switch (prescription.type) {
    case "strength":
    case "bodyweight": {
      return repDone(prescription.sets, prescription.reps, sets);
    }
    case "timed-hold": {
      return holdDone(prescription.sets, prescription.holdSec, sets);
    }
    case "distance-cardio": {
      return cardioDone(result.cardio, prescription.distanceMeters);
    }
    default: {
      return { done: `${completedCount(sets)} sets ✓`, isAsPrescribed: true };
    }
  }
};

/** Rep-based done: `5×5 ✓` when uniform and on target, else the per-set list
 *  (`3×10, 10, 8`) with a tick only when every set met its target. */
const repDone = (
  targetSets: number,
  targetReps: number,
  sets: readonly SetResult[],
): { done: string; isAsPrescribed: boolean } => {
  const reps = sets.map((entry) => entry.reps ?? 0);
  const isAsPrescribed =
    sets.length >= targetSets &&
    sets.every((entry) => entry.completed) &&
    reps.every((count) => count >= targetReps);
  const uniform =
    sets.length === targetSets && reps.every((count) => count === targetReps);
  const body = uniform
    ? `${targetSets}×${targetReps}`
    : `${sets.length}×${reps.join(", ")}`;
  return { done: isAsPrescribed ? `${body} ✓` : body, isAsPrescribed };
};

/** Timed-hold done: `3× 45s ✓` when every hold met its target. */
const holdDone = (
  targetSets: number,
  targetHoldSec: number,
  sets: readonly SetResult[],
): { done: string; isAsPrescribed: boolean } => {
  const holds = sets.map((entry) => entry.holdSec ?? 0);
  const isAsPrescribed =
    sets.length >= targetSets &&
    sets.every((entry) => entry.completed) &&
    holds.every((held) => held >= targetHoldSec);
  const uniform =
    sets.length === targetSets && holds.every((held) => held === targetHoldSec);
  const body = uniform
    ? `${targetSets}× ${targetHoldSec}s`
    : `${sets.length}× ${holds.join(", ")}s`;
  return { done: isAsPrescribed ? `${body} ✓` : body, isAsPrescribed };
};

/** Cardio done: the logged distance and split, ticked when the distance met the
 *  target. */
const cardioDone = (
  cardio: CardioResult | undefined,
  targetMeters: number,
): { done: string; isAsPrescribed: boolean } => {
  if (cardio === undefined || cardio.distanceMeters === undefined) {
    return { done: "Logged", isAsPrescribed: false };
  } else {
    const split =
      cardio.splitSecPer500 === undefined
        ? ""
        : ` @ ${formatSplit(cardio.splitSecPer500)}`;
    const isAsPrescribed = cardio.distanceMeters >= targetMeters;
    const body = `${formatDistance(cardio.distanceMeters)}${split}`;
    return { done: isAsPrescribed ? `${body} ✓` : body, isAsPrescribed };
  }
};

/** How many sets were completed — the fallback done summary for cardio/circuit
 *  shapes without a rep-by-rep grammar. */
const completedCount = (sets: readonly SetResult[]): number =>
  sets.filter((entry) => entry.completed).length;

/** The one-decimal average RPE over the sets that carry one, or `undefined`
 *  when none was recorded. Rounds half up, cleaning binary artifacts first so a
 *  boundary like 8.15 resolves deterministically. */
const averageRpe = (sets: readonly SetResult[]): string | undefined => {
  const rpes = sets.flatMap((entry) =>
    entry.rpe === undefined ? [] : [entry.rpe],
  );
  if (rpes.length === 0) {
    return undefined;
  } else {
    const mean = rpes.reduce((total, rpe) => total + rpe, 0) / rpes.length;
    const tenths = Math.round(Number((mean * 10).toFixed(6)));
    return (tenths / 10).toFixed(1);
  }
};
