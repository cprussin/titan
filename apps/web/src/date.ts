/**
 * Calendar helpers shared by scheduling and history. Dates are handled as UTC
 * `YYYY-MM-DD` strings so a session's "day" is stable regardless of server
 * locale. ISO weekdays run 1 = Monday … 7 = Sunday, matching the program model.
 */

/** The `YYYY-MM-DD` date for `now` (defaults to the current time). */
export const dateIso = (now: Date = new Date()): string =>
  now.toISOString().slice(0, 10);

/** The ISO weekday (1 = Mon … 7 = Sun) for a `YYYY-MM-DD` date. */
export const isoDayOfWeek = (dateString: string): number => {
  const day = new Date(`${dateString}T00:00:00.000Z`).getUTCDay();
  return day === 0 ? 7 : day;
};
