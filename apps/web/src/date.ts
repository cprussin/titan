/**
 * Calendar helpers shared by scheduling and history. Dates are handled as
 * `YYYY-MM-DD` strings anchored to a specific IANA time zone, so a session's
 * "day" is the athlete's local calendar day rather than the server's UTC day.
 * ISO weekdays run 1 = Monday … 7 = Sunday, matching the program model.
 */

/** The `YYYY-MM-DD` calendar date of `now` in the given IANA `timeZone`. */
export const dateIso = (timeZone: string, now: Date = new Date()): string => {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(now);
  return `${datePart(parts, "year")}-${datePart(parts, "month")}-${datePart(parts, "day")}`;
};

/** The ISO weekday (1 = Mon … 7 = Sun) for a `YYYY-MM-DD` date. */
export const isoDayOfWeek = (dateString: string): number => {
  const day = new Date(`${dateString}T00:00:00.000Z`).getUTCDay();
  return day === 0 ? 7 : day;
};

const datePart = (
  parts: readonly Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string => {
  const match = parts.find((entry) => entry.type === type);
  if (match === undefined) {
    throw new Error(`formatted date is missing its ${type} field`);
  } else {
    return match.value;
  }
};
