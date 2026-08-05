import type { Db } from "@titan/db/client";
import { listExercises } from "@titan/db/exercises";

/** A lookup from exercise id to display name, for rendering plans and history. */
export const exerciseNames = async (db: Db): Promise<Map<string, string>> => {
  const exercises = await listExercises(db);
  return new Map(exercises.map((exercise) => [exercise.id, exercise.name]));
};
