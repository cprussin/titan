import { isoDayOfWeek } from "../date";

/** Uppercase ISO-weekday abbreviations, indexed by `isoDayOfWeek - 1`. */
const WEEKDAY_ABBREVIATIONS = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
] as const;

/** A `YYYY-MM-DD` date anchored to UTC midnight, matching {@link isoDayOfWeek}
 *  so weekday math and calendar math agree. */
const atUtcMidnight = (date: string): Date => new Date(`${date}T00:00:00.000Z`);

/** The `YYYY-MM-DD` date `offset` days from `date` (offset may be negative). */
const addDays = (date: string, offset: number): string => {
  const shifted = atUtcMidnight(date);
  shifted.setUTCDate(shifted.getUTCDate() + offset);
  return shifted.toISOString().slice(0, 10);
};

/**
 * The seven `YYYY-MM-DD` dates of the ISO week (Monday → Sunday) containing
 * `date`. The dashboard's week ribbon spans this window; a program week shares a
 * single absolute-week index, so the ribbon reads left-to-right as one week.
 */
export const weekDates = (date: string): readonly string[] => {
  const monday = addDays(date, -(isoDayOfWeek(date) - 1));
  return Array.from({ length: 7 }, (_, offset) => addDays(monday, offset));
};

/** A ribbon cell's micro-label — the uppercase weekday abbreviation and the
 *  (un-padded) day of the month, e.g. `MON 10`. */
export const dayLabel = (date: string): string =>
  `${WEEKDAY_ABBREVIATIONS[isoDayOfWeek(date) - 1]} ${atUtcMidnight(date).getUTCDate()}`;
