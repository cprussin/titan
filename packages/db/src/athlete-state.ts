import { z } from "zod";
import type { Db } from "./client";

/**
 * Where an athlete currently is in their program: the active program version
 * and the absolute training week. This is live app state (not part of the
 * immutable domain history), so it lives here rather than in `@titan/domain`.
 */
export const athleteStateSchema = z.object({
  absoluteWeek: z.number().int().positive(),
  programVersionId: z.string(),
  updatedAt: z.string(),
  userId: z.string(),
});

export type AthleteState = z.infer<typeof athleteStateSchema>;

export const getAthleteState = async (
  db: Db,
  userId: string,
): Promise<AthleteState | undefined> => {
  const rows = await db<
    {
      absolute_week: number;
      program_version_id: string;
      updated_at: string;
      user_id: string;
    }[]
  >`
    SELECT user_id, program_version_id, absolute_week, updated_at
    FROM athlete_state WHERE user_id = ${userId}
  `;
  const [first] = rows;
  return first === undefined
    ? undefined
    : athleteStateSchema.parse({
        absoluteWeek: first.absolute_week,
        programVersionId: first.program_version_id,
        updatedAt: first.updated_at,
        userId: first.user_id,
      });
};

/** Clear any athlete's active position that points at a version of `programId`,
 *  so hard-deleting the program leaves no dangling active pointer behind. */
export const clearAthleteStateForProgram = async (
  db: Db,
  programId: string,
): Promise<void> => {
  await db`
    DELETE FROM athlete_state
    WHERE program_version_id IN (
      SELECT id FROM program_versions WHERE program_id = ${programId}
    )
  `;
};

export const setAthleteState = async (
  db: Db,
  state: AthleteState,
): Promise<void> => {
  await db`
    INSERT INTO athlete_state (user_id, program_version_id, absolute_week, updated_at)
    VALUES (${state.userId}, ${state.programVersionId}, ${state.absoluteWeek}, ${state.updatedAt})
    ON CONFLICT (user_id) DO UPDATE SET
      program_version_id = EXCLUDED.program_version_id,
      absolute_week = EXCLUDED.absolute_week,
      updated_at = EXCLUDED.updated_at
  `;
};
