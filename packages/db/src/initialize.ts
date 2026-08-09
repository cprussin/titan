import type { Db } from "./client";
import { applySchema } from "./schema";
import { seed } from "./seed";

/**
 * Bring the database into a consistent, up-to-date state on server start: apply
 * the schema, then sync the bundled catalog. Both steps are idempotent — the
 * schema is `IF NOT EXISTS` and every seed write is an upsert — so this runs on
 * every start and is cheap on an already-initialized database. Running it
 * unconditionally (rather than only on an empty database) is what lets newly
 * added or edited bundled programs reach an existing database; the athlete's
 * own progress is preserved because {@link seed} only *places* an athlete who
 * has no state yet.
 */
export const initialize = async (db: Db): Promise<void> => {
  await applySchema(db);
  await seed(db);
};
