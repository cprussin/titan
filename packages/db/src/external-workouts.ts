import type { ExternalWorkout } from "@titan/domain/external";
import { externalWorkoutSchema } from "@titan/domain/external";
import type { Db } from "./client";
import { jsonb } from "./jsonb";
import { parseDataRows } from "./parse-rows";
import { repairLegacyHeartRate } from "./repair-legacy-heart-rate";

/** Insert an imported workout, ignoring a duplicate `(provider, external_id)` so
 *  re-syncs are idempotent. Returns whether a new row was inserted. */
export const insertExternalWorkout = async (
  db: Db,
  workout: ExternalWorkout,
): Promise<boolean> => {
  const rows = await db`
    INSERT INTO external_workouts
      (id, user_id, connection_id, provider, external_id, match_status, data)
    VALUES (
      ${workout.id},
      ${workout.userId},
      ${workout.connectionId},
      ${workout.provider},
      ${workout.externalId},
      ${workout.matchStatus},
      ${jsonb(db, workout)}
    )
    ON CONFLICT (provider, external_id) DO NOTHING
    RETURNING id
  `;
  return rows.length > 0;
};

export const updateExternalWorkout = async (
  db: Db,
  workout: ExternalWorkout,
): Promise<void> => {
  await db`
    UPDATE external_workouts
    SET match_status = ${workout.matchStatus}, data = ${jsonb(db, workout)}
    WHERE id = ${workout.id}
  `;
};

export const listExternalWorkouts = async (
  db: Db,
  userId: string,
  limit: number,
): Promise<ExternalWorkout[]> => {
  const rows = await db<{ data: unknown }[]>`
    SELECT data FROM external_workouts
    WHERE user_id = ${userId}
    ORDER BY external_id DESC
    LIMIT ${limit}
  `;
  return parseDataRows(
    externalWorkoutSchema,
    rows.map((row) => ({ data: repairLegacyHeartRate(row.data) })),
  );
};
