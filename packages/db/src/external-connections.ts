import type {
  ExternalConnection,
  ExternalProvider,
} from "@titan/domain/external";
import { externalConnectionSchema } from "@titan/domain/external";
import type { Db } from "./client";
import { parseFirstDataRow } from "./parse-rows";

export const getConnection = async (
  db: Db,
  userId: string,
  provider: ExternalProvider,
): Promise<ExternalConnection | undefined> => {
  const rows = await db<{ data: unknown }[]>`
    SELECT data FROM external_connections
    WHERE user_id = ${userId} AND provider = ${provider}
    LIMIT 1
  `;
  return parseFirstDataRow(externalConnectionSchema, rows);
};

export const upsertConnection = async (
  db: Db,
  connection: ExternalConnection,
): Promise<void> => {
  await db`
    INSERT INTO external_connections (id, user_id, provider, data)
    VALUES (
      ${connection.id},
      ${connection.userId},
      ${connection.provider},
      ${db.json(connection)}
    )
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
  `;
};
