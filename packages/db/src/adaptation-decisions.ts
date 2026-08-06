import type { AdaptationDecision } from "@titan/domain/adaptation-decision";
import { adaptationDecisionSchema } from "@titan/domain/adaptation-decision";
import type { Db } from "./client";
import { parseDataRows } from "./parse-rows";

export const insertAdaptationDecisions = async (
  db: Db,
  decisions: readonly AdaptationDecision[],
): Promise<void> => {
  await Promise.all(
    decisions.map(
      (decision) => db`
        INSERT INTO adaptation_decisions
          (id, user_id, workout_session_id, created_at, data)
        VALUES (
          ${decision.id},
          ${decision.userId},
          ${decision.workoutSessionId ?? null},
          ${decision.createdAt},
          ${db.json(decision)}
        )
        ON CONFLICT (id) DO NOTHING
      `,
    ),
  );
};

export const deleteAdaptationDecisionsBySession = async (
  db: Db,
  workoutSessionId: string,
): Promise<void> => {
  await db`
    DELETE FROM adaptation_decisions
    WHERE workout_session_id = ${workoutSessionId}
  `;
};

export const listAdaptationDecisionsBySession = async (
  db: Db,
  workoutSessionId: string,
): Promise<AdaptationDecision[]> => {
  const rows = await db<{ data: unknown }[]>`
    SELECT data FROM adaptation_decisions
    WHERE workout_session_id = ${workoutSessionId}
    ORDER BY created_at
  `;
  return parseDataRows(adaptationDecisionSchema, rows);
};

export const listRecentAdaptationDecisions = async (
  db: Db,
  userId: string,
  limit: number,
): Promise<AdaptationDecision[]> => {
  const rows = await db<{ data: unknown }[]>`
    SELECT data FROM adaptation_decisions
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return parseDataRows(adaptationDecisionSchema, rows);
};
