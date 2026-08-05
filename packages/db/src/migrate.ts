import { createDb } from "./client";
import { databaseUrl } from "./database-url";
import { applySchema } from "./schema";

/**
 * CLI wrapper: apply the schema to the database named by `DATABASE_URL`. The
 * schema is idempotent, so running it repeatedly is safe. Run with
 * `bun run --filter @titan/db migrate`.
 */
const db = createDb(databaseUrl());
await applySchema(db);
await db.end();
// biome-ignore lint/suspicious/noConsole: CLI script progress output
console.log("Titan schema applied.");
