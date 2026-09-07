import { z } from "zod";
import type { Db } from "./client";

/**
 * Where an athlete was placed in their program: the active program version, the
 * absolute training week they start from, and the date that placement took
 * effect. The week they are on *now* is derived from the placement and the weeks
 * they have trained since (see `absoluteWeekFor`), so this row only changes when
 * they are placed somewhere new. This is live app state (not part of the
 * immutable domain history), so it lives here rather than in `@titan/domain`.
 *
 * `placedOn` is absent on rows written before placements recorded a date; the
 * app anchors those from the athlete's own training history.
 */
export const athleteStateSchema = z.object({
  absoluteWeek: z.number().int().positive(),
  placedOn: z.string().optional(),
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
      placed_on: string | null;
      program_version_id: string;
      updated_at: string;
      user_id: string;
    }[]
  >`
    SELECT user_id, program_version_id, absolute_week, placed_on, updated_at
    FROM athlete_state WHERE user_id = ${userId}
  `;
  const [first] = rows;
  return first === undefined
    ? undefined
    : athleteStateSchema.parse({
        absoluteWeek: first.absolute_week,
        placedOn: first.placed_on ?? undefined,
        programVersionId: first.program_version_id,
        updatedAt: first.updated_at,
        userId: first.user_id,
      });
};

export const setAthleteState = async (
  db: Db,
  state: AthleteState,
): Promise<void> => {
  await db`
    INSERT INTO athlete_state
      (user_id, program_version_id, absolute_week, placed_on, updated_at)
    VALUES (
      ${state.userId},
      ${state.programVersionId},
      ${state.absoluteWeek},
      ${state.placedOn ?? null},
      ${state.updatedAt}
    )
    ON CONFLICT (user_id) DO UPDATE SET
      program_version_id = EXCLUDED.program_version_id,
      absolute_week = EXCLUDED.absolute_week,
      placed_on = EXCLUDED.placed_on,
      updated_at = EXCLUDED.updated_at
  `;
};
