import postgres from "postgres";

/** The Postgres client — a tagged-template `sql` function. Titan deliberately
 *  uses no ORM: every query is a template literal, and postgres.js parameterizes
 *  interpolated values, so the query text and user data never mix. */
export type Db = ReturnType<typeof postgres>;

/**
 * Open a connection pool to `connectionString`. `prepare: false` keeps the
 * client compatible with transaction-pooling proxies (Neon's pooled endpoint,
 * PgBouncer), which don't support server-side prepared statements. SSL is taken
 * from the connection string (`?sslmode=require`).
 */
export const createDb = (connectionString: string): Db =>
  postgres(connectionString, { prepare: false });
