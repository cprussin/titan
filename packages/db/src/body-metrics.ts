import type { BodyMetric } from "@titan/domain/body-metric";
import { bodyMetricSchema } from "@titan/domain/body-metric";
import type { Db } from "./client";
import { parseDataRows } from "./parse-rows";

export const insertBodyMetric = async (
  db: Db,
  metric: BodyMetric,
): Promise<void> => {
  await db`
    INSERT INTO body_metrics (id, user_id, date, data)
    VALUES (${metric.id}, ${metric.userId}, ${metric.date}, ${db.json(metric)})
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, date = EXCLUDED.date
  `;
};

export const listBodyMetrics = async (
  db: Db,
  userId: string,
  limit: number,
): Promise<BodyMetric[]> => {
  const rows = await db<{ data: unknown }[]>`
    SELECT data FROM body_metrics
    WHERE user_id = ${userId}
    ORDER BY date DESC
    LIMIT ${limit}
  `;
  return parseDataRows(bodyMetricSchema, rows);
};

export const deleteBodyMetric = async (db: Db, id: string): Promise<void> => {
  await db`DELETE FROM body_metrics WHERE id = ${id}`;
};

export const deleteBodyMetricsByUser = async (
  db: Db,
  userId: string,
): Promise<void> => {
  await db`DELETE FROM body_metrics WHERE user_id = ${userId}`;
};
