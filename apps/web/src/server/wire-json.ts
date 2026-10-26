/**
 * A view model as the JSON the Android app reads. The page view models carry
 * `ReadonlyMap`s (exercise names and the like), which `JSON.stringify` would
 * write as `{}`; each becomes a plain object keyed by its keys instead. Every
 * other value passes through for `JSON.stringify` to write as usual.
 */
export const wireJson = (value: unknown): unknown => {
  if (value instanceof Map) {
    return Object.fromEntries(
      [...value].map(([key, entry]) => [String(key), wireJson(entry)]),
    );
  } else if (Array.isArray(value)) {
    return value.map(wireJson);
  } else if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, wireJson(entry)]),
    );
  } else {
    return value;
  }
};
