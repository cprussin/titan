import type { NormalizedWorkout } from "@titan/domain/external";
import type { ExerciseResult } from "@titan/domain/result";
import type { PrescribedExercise } from "@titan/domain/workout-session";

/**
 * Build the recorded {@link ExerciseResult} for a rowing piece from a matched
 * Concept2 import, so a workout found on the ergometer is logged exactly as a
 * manual cardio entry would be. The normalized summary already carries the
 * split/stroke-rate optics; the imported intervals carry through only when the
 * piece had them.
 */
export const buildImportResult = (
  prescribed: PrescribedExercise,
  normalized: NormalizedWorkout,
): ExerciseResult => ({
  cardio: normalized.summary,
  exerciseId: prescribed.exerciseId,
  id: crypto.randomUUID(),
  prescription: prescribed.prescription,
  sets: [],
  slotId: prescribed.slotId,
  ...(normalized.intervals.length > 0
    ? { intervals: normalized.intervals }
    : {}),
});
