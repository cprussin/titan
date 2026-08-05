import type { PersonalRecord } from "@titan/domain/personal-record";
import { personalRecordSchema } from "@titan/domain/personal-record";
import type { Db } from "./client";
import { parseDataRows } from "./parse-rows";

export const upsertPersonalRecord = async (
  db: Db,
  record: PersonalRecord,
): Promise<void> => {
  await db`
    INSERT INTO personal_records (id, user_id, exercise_id, data)
    VALUES (
      ${record.id},
      ${record.userId},
      ${record.exerciseId},
      ${db.json(record)}
    )
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
  `;
};

export const listPersonalRecords = async (
  db: Db,
  userId: string,
): Promise<PersonalRecord[]> => {
  const rows = await db<{ data: unknown }[]>`
    SELECT data FROM personal_records
    WHERE user_id = ${userId}
    ORDER BY exercise_id
  `;
  return parseDataRows(personalRecordSchema, rows);
};
