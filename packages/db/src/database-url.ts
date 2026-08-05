/**
 * The `DATABASE_URL` for the migrate/seed CLI scripts, which run under Bun.
 * Reads `Bun.env` (not `process.env`, which the lint config forbids) and fails
 * loudly when unset — a missing database URL is an operator error, not a
 * recoverable condition.
 */
export const databaseUrl = (): string => {
  const url = Bun.env.DATABASE_URL;
  if (url === undefined) {
    throw new Error("DATABASE_URL is not set");
  } else {
    return url;
  }
};
