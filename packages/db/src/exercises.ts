import type { Exercise } from "@titan/domain/exercise";
import { exerciseSchema } from "@titan/domain/exercise";
import type { Db } from "./client";
import { parseDataRows } from "./parse-rows";

export const listExercises = async (db: Db): Promise<Exercise[]> => {
  const rows = await db<
    { data: unknown }[]
  >`SELECT data FROM exercises ORDER BY id`;
  return parseDataRows(exerciseSchema, rows);
};

export const upsertExercise = async (
  db: Db,
  exercise: Exercise,
): Promise<void> => {
  await db`
    INSERT INTO exercises (id, data)
    VALUES (${exercise.id}, ${db.json(exercise)})
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
  `;
};
