import type { z } from "zod";

/** A row from a `SELECT data FROM …` query, before its JSONB payload is parsed
 *  into a domain object. */
export type DataRow = { data: unknown };

/**
 * Parse the `data` JSONB column of every row against a domain schema. This is
 * the boundary where untrusted database bytes become typed domain objects (see
 * DATA.md) — `.parse` throws on a row that doesn't match, surfacing schema drift
 * loudly rather than letting a malformed row flow inward.
 */
export const parseDataRows = <T>(
  schema: z.ZodType<T>,
  rows: readonly DataRow[],
): T[] => rows.map((row) => schema.parse(row.data));

/** Parse the first row's `data`, or `undefined` when the query returned none. */
export const parseFirstDataRow = <T>(
  schema: z.ZodType<T>,
  rows: readonly DataRow[],
): T | undefined => {
  const [first] = rows;
  return first === undefined ? undefined : schema.parse(first.data);
};
