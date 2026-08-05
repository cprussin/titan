import type { WorkoutSession } from "@titan/domain/workout-session";
import { workoutSessionSchema } from "@titan/domain/workout-session";
import type { Db } from "./client";
import { parseDataRows, parseFirstDataRow } from "./parse-rows";

export const getWorkoutSession = async (
  db: Db,
  id: string,
): Promise<WorkoutSession | undefined> => {
  const rows = await db<
    { data: unknown }[]
  >`SELECT data FROM workout_sessions WHERE id = ${id}`;
  return parseFirstDataRow(workoutSessionSchema, rows);
};

export const getWorkoutSessionByDate = async (
  db: Db,
  userId: string,
  scheduledDate: string,
): Promise<WorkoutSession | undefined> => {
  const rows = await db<{ data: unknown }[]>`
    SELECT data FROM workout_sessions
    WHERE user_id = ${userId} AND scheduled_date = ${scheduledDate}
    ORDER BY status DESC LIMIT 1
  `;
  return parseFirstDataRow(workoutSessionSchema, rows);
};

export const listWorkoutSessions = async (
  db: Db,
  userId: string,
  limit: number,
): Promise<WorkoutSession[]> => {
  const rows = await db<{ data: unknown }[]>`
    SELECT data FROM workout_sessions
    WHERE user_id = ${userId}
    ORDER BY scheduled_date DESC
    LIMIT ${limit}
  `;
  return parseDataRows(workoutSessionSchema, rows);
};

export const upsertWorkoutSession = async (
  db: Db,
  session: WorkoutSession,
): Promise<void> => {
  await db`
    INSERT INTO workout_sessions
      (id, user_id, program_version_id, scheduled_date, status, data)
    VALUES (
      ${session.id},
      ${session.userId},
      ${session.programVersionId},
      ${session.scheduledDate},
      ${session.status},
      ${db.json(session)}
    )
    ON CONFLICT (id) DO UPDATE SET
      scheduled_date = EXCLUDED.scheduled_date,
      status = EXCLUDED.status,
      data = EXCLUDED.data
  `;
};
