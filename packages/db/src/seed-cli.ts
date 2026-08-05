import { createDb } from "./client";
import { databaseUrl } from "./database-url";
import { seed } from "./seed";

/** CLI wrapper: seed the database named by `DATABASE_URL`. Run with
 *  `bun run --filter @titan/db seed`. */
const db = createDb(databaseUrl());
await seed(db);
await db.end();
// biome-ignore lint/suspicious/noConsole: CLI script progress output
console.log("Seed complete.");
