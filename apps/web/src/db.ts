import { createDb } from "@titan/db/client";
import { env } from "./env";

/** The process-wide database pool. `createDb` is called once at module load so
 *  every request reuses the same connection pool. */
export const db = createDb(env.DATABASE_URL);
