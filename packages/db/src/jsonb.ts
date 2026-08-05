import type { Db } from "./client";

/**
 * Bind a value for a `jsonb` column. postgres.js's `sql.json` requires a
 * structural `JSONValue`, but some domain fields are typed `unknown` by design
 * (e.g. an imported provider payload retained verbatim). This is the *serialize*
 * boundary — writing a Zod-parsed, JSON-serializable domain object to the
 * database — not a parse of external data, so asserting the JSON parameter type
 * here is safe and kept in one place.
 */
export const jsonb = (db: Db, value: unknown): ReturnType<Db["json"]> =>
  db.json(value as Parameters<Db["json"]>[0]);
