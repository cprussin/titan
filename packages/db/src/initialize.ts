import type { Db } from "./client";
import { applySchema } from "./schema";
import { seed } from "./seed";

/**
 * Bring an empty or uninitialized database up to date: apply the schema, then —
 * only if no program has ever been loaded — seed the bundled programs. Idempotent
 * and cheap on an already-initialized database (schema is `IF NOT EXISTS`; the
 * seed is skipped after a single count check), so it is safe for the app to run
 * on startup.
 */
export const initializeIfEmpty = async (db: Db): Promise<void> => {
  await applySchema(db);
  const rows = await db<{ count: number }[]>`
    SELECT count(*)::int AS count FROM program_versions
  `;
  if ((rows[0]?.count ?? 0) === 0) {
    await seed(db);
  }
};
