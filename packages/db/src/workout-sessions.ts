import type {
  InProgressExercise,
  WorkoutSession,
} from "@titan/domain/workout-session";
import { workoutSessionSchema } from "@titan/domain/workout-session";
import { z } from "zod";
import type { Db } from "./client";
import { parseDataRows, parseFirstDataRow } from "./parse-rows";

const completedWorkoutDateSchema = z.object({
  programVersionId: z.string(),
  scheduledDate: z.string(),
});

const completedWorkoutDatesSchema = z.array(completedWorkoutDateSchema);

/** A day the athlete completed a session on, and the program version it was
 *  prescribed from. */
export type CompletedWorkoutDate = z.infer<typeof completedWorkoutDateSchema>;

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

/**
 * The days the athlete completed a session on, oldest first. Read unwindowed —
 * the athlete's program week is counted from the calendar weeks they trained, so
 * dropping the oldest of them would rewind their position — and so it selects
 * the two columns that counting needs rather than whole session documents.
 */
export const listCompletedWorkoutDates = async (
  db: Db,
  userId: string,
): Promise<readonly CompletedWorkoutDate[]> => {
  const rows = await db<
    { program_version_id: string; scheduled_date: string }[]
  >`
    SELECT DISTINCT program_version_id, scheduled_date FROM workout_sessions
    WHERE user_id = ${userId} AND status = 'completed'
    ORDER BY scheduled_date
  `;
  return completedWorkoutDatesSchema.parse(
    rows.map((row) => ({
      programVersionId: row.program_version_id,
      scheduledDate: row.scheduled_date,
    })),
  );
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

/**
 * Replace an open session's document, in one statement conditional on the
 * session still being in progress and still holding the `priorResultCount`
 * results this writer read. A session finished, or advanced to another exercise,
 * between that read and this write therefore turns the write away instead of
 * being overwritten from the older view. A change that leaves the count alone —
 * another device replacing a slot it had already recorded — passes, and the
 * later write wins. The result reports whether the row was still open to it.
 */
export const updateInProgressWorkoutSession = async (
  db: Db,
  session: WorkoutSession,
  priorResultCount: number,
): Promise<boolean> => {
  const updated = await db`
    UPDATE workout_sessions
    SET
      scheduled_date = ${session.scheduledDate},
      status = ${session.status},
      data = ${db.json(session)}
    WHERE
      id = ${session.id}
      AND status = 'in-progress'
      AND jsonb_array_length(data -> 'results') = ${priorResultCount}
  `;
  return updated.count > 0;
};

/**
 * Store the sets logged against the exercise underway, leaving the rest of the
 * session document untouched — a set logged on one device can never carry a
 * stale snapshot of the results, the status, or anything else back into the row.
 * The status test is part of the write rather than a separate read, so a session
 * finished in between takes no more progress; the result reports whether the row
 * was still open to it.
 */
export const setWorkoutSessionProgress = async (
  db: Db,
  id: string,
  inProgress: InProgressExercise,
): Promise<boolean> => {
  const updated = await db`
    UPDATE workout_sessions
    SET data = jsonb_set(data, '{inProgress}', ${db.json(inProgress)}::jsonb)
    WHERE id = ${id} AND status = 'in-progress'
  `;
  return updated.count > 0;
};

export const deleteWorkoutSession = async (
  db: Db,
  id: string,
): Promise<void> => {
  await db`DELETE FROM workout_sessions WHERE id = ${id}`;
};

export const deleteWorkoutSessionsByUser = async (
  db: Db,
  userId: string,
): Promise<void> => {
  await db`DELETE FROM workout_sessions WHERE user_id = ${userId}`;
};
