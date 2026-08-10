import type { LoadUnit } from "@titan/domain/load-unit";
import { estimateOneRepMax } from "@titan/domain/one-rep-max";
import type { PersonalRecord } from "@titan/domain/personal-record";
import type { ExerciseResult, SetResult } from "@titan/domain/result";
import type { WorkoutSession } from "@titan/domain/workout-session";

export type DetectPersonalRecordsInput = {
  achievedAt: string;
  newId: () => string;
  /** Best estimated 1RM per exercise *before* this session. */
  priorBestByExercise: ReadonlyMap<string, number>;
  session: WorkoutSession;
};

/**
 * Detect estimated-1RM personal records set in a session. For each exercise
 * with completed weighted sets, compare this session's best estimated 1RM to the
 * athlete's prior best; a strictly greater value is a new record. Pure — the
 * prior bests, ids, and timestamp are all supplied.
 */
export const detectPersonalRecords = (
  input: DetectPersonalRecordsInput,
): PersonalRecord[] =>
  input.session.results.flatMap((result) => {
    const best = bestEstimatedOneRepMax(result);
    const prior = input.priorBestByExercise.get(result.exerciseId);
    return best !== undefined && (prior === undefined || best > prior)
      ? [
          {
            achievedAt: input.achievedAt,
            exerciseId: result.exerciseId,
            id: input.newId(),
            kind: "estimated-1rm" as const,
            unit: resultUnit(result),
            userId: input.session.userId,
            value: Math.round(best * 10) / 10,
            workoutSessionId: input.session.id,
          },
        ]
      : [];
  });

/** The unit a result's loads were logged in — its snapshot prescription carries
 *  it for strength work; everything else is pounds. */
const resultUnit = (result: ExerciseResult): LoadUnit =>
  result.prescription.type === "strength" ? result.prescription.unit : "lb";

/** The best estimated 1RM across a result's completed weighted sets, or
 *  `undefined` for a set with no load (cardio, unweighted). */
const bestEstimatedOneRepMax = (result: ExerciseResult): number | undefined => {
  const estimates = result.sets
    .filter(
      (set): set is SetResult & { reps: number; weight: number } =>
        set.completed &&
        set.reps !== undefined &&
        set.reps > 0 &&
        set.weight !== undefined &&
        set.weight > 0,
    )
    .map((set) => estimateOneRepMax(set.weight, set.reps));
  return estimates.length === 0 ? undefined : Math.max(...estimates);
};
