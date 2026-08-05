import type { User } from "@titan/domain/profile";
import { userSchema } from "@titan/domain/profile";
import type { Db } from "./client";
import { parseFirstDataRow } from "./parse-rows";

export const getUser = async (
  db: Db,
  id: string,
): Promise<User | undefined> => {
  const rows = await db<
    { data: unknown }[]
  >`SELECT data FROM users WHERE id = ${id}`;
  return parseFirstDataRow(userSchema, rows);
};

export const upsertUser = async (db: Db, user: User): Promise<void> => {
  await db`
    INSERT INTO users (id, data) VALUES (${user.id}, ${db.json(user)})
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
  `;
};
