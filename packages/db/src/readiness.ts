import type { ReadinessEntry } from "@titan/domain/readiness";
import { readinessEntrySchema } from "@titan/domain/readiness";
import type { Db } from "./client";
import { parseFirstDataRow } from "./parse-rows";

export const insertReadiness = async (
  db: Db,
  entry: ReadinessEntry,
): Promise<void> => {
  await db`
    INSERT INTO readiness_entries (id, user_id, date, data)
    VALUES (${entry.id}, ${entry.userId}, ${entry.date}, ${db.json(entry)})
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, date = EXCLUDED.date
  `;
};

export const getReadinessByDate = async (
  db: Db,
  userId: string,
  date: string,
): Promise<ReadinessEntry | undefined> => {
  const rows = await db<{ data: unknown }[]>`
    SELECT data FROM readiness_entries
    WHERE user_id = ${userId} AND date = ${date}
    ORDER BY id DESC LIMIT 1
  `;
  return parseFirstDataRow(readinessEntrySchema, rows);
};
