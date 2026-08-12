/**
 * Migrate-on-read repair for `external_workouts` rows persisted before Concept2's
 * `heart_rate.average: 0` (reported for a workout logged without a monitor) was
 * mapped to "absent". Those rows stored `avgHr: 0` on the summary and on
 * intervals, which the domain's strict `avgHr` (`z.number().positive()`) rejects,
 * so parsing an old row threw a ZodError. Dropping a non-positive `avgHr` here —
 * before the row hits `.parse` — lets it read as though it had no reading, while
 * genuinely malformed rows still fall through unchanged and fail the parser
 * loudly (see DATA.md, "on read … migrate"). New writes never produce `avgHr: 0`,
 * so this only ever touches pre-fix rows.
 */

type JsonObject = Record<string, unknown>;

export const repairLegacyHeartRate = (data: unknown): unknown =>
  isJsonObject(data) && isJsonObject(data.normalized)
    ? { ...data, normalized: repairNormalized(data.normalized) }
    : data;

const repairNormalized = (normalized: JsonObject): JsonObject => ({
  ...normalized,
  intervals: Array.isArray(normalized.intervals)
    ? normalized.intervals.map(dropNonPositiveAvgHr)
    : normalized.intervals,
  summary: dropNonPositiveAvgHr(normalized.summary),
});

/** Strip `avgHr` from a summary/interval when it is a non-positive number. */
const dropNonPositiveAvgHr = (leaf: unknown): unknown => {
  if (isJsonObject(leaf) && typeof leaf.avgHr === "number" && leaf.avgHr <= 0) {
    const { avgHr, ...rest } = leaf;
    return rest;
  } else {
    return leaf;
  }
};

const isJsonObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);
