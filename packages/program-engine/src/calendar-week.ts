const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * The `YYYY-MM-DD` Monday that opens the ISO week containing `date`. Dates are
 * read at UTC midnight, matching the rest of the scheduling math, so a week is
 * the same seven calendar days everywhere.
 */
export const weekStart = (date: string): string => {
  const at = new Date(`${date}T00:00:00.000Z`);
  const isoDayOfWeek = at.getUTCDay() === 0 ? 7 : at.getUTCDay();
  at.setUTCDate(at.getUTCDate() - (isoDayOfWeek - 1));
  return at.toISOString().slice(0, 10);
};

/**
 * How many calendar weeks separate the weeks containing `from` and `to` —
 * negative when `to` is the earlier of the two. Week starts are UTC midnight
 * Mondays, so the span is always a whole number of weeks.
 */
export const weeksBetween = (from: string, to: string): number =>
  (Date.parse(`${weekStart(to)}T00:00:00.000Z`) -
    Date.parse(`${weekStart(from)}T00:00:00.000Z`)) /
  MS_PER_WEEK;
