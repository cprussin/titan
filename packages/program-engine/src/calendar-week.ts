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
