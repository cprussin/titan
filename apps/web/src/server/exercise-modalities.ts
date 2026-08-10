import type { Db } from "@titan/db/client";
import { listExercises } from "@titan/db/exercises";
import type { Modality } from "@titan/domain/movement";

/** A lookup from exercise id to modality, so the execution screen can tell a
 *  rowing piece (the `rower` modality) apart from other cardio and offer the
 *  Concept2 hand-off only where it applies. */
export const exerciseModalities = async (
  db: Db,
): Promise<Map<string, Modality>> => {
  const exercises = await listExercises(db);
  return new Map(exercises.map((exercise) => [exercise.id, exercise.modality]));
};
