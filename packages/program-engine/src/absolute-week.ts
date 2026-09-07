import { weekStart } from "./calendar-week";

/** Where the athlete stands in a program: the absolute training week they were
 *  placed at, and a date inside the calendar week that placement took effect. */
export type Placement = {
  absoluteWeek: number;
  placedOn: string;
};

/**
 * The absolute training week (1-based across the whole program) that the
 * calendar week containing `targetDate` lands on.
 *
 * A program week is a *trained* calendar week. The position advances once per
 * calendar week the athlete logged something in — not per session, and not per
 * weekday of the week template, so no single day's session can hold the program
 * back — and a week with nothing logged doesn't advance it at all, so a fortnight
 * off returns the athlete to the week they left. The week in progress always
 * counts, which is what makes the week ahead read one further on before today's
 * session is logged.
 *
 * Weeks behind the placement count back the same way, so a past week projects
 * the position it was trained at.
 */
export const absoluteWeekFor = (
  placement: Placement,
  completedDates: readonly string[],
  today: string,
  targetDate: string,
): number => {
  const anchor = weekStart(placement.placedOn);
  const target = weekStart(targetDate);
  const trained = trainedWeeks(completedDates, today);
  return target >= anchor
    ? placement.absoluteWeek + weeksIn(trained, anchor, target)
    : placement.absoluteWeek - weeksIn(trained, target, anchor);
};

/** How many of `weeks` fall in the half-open span `[from, to)`. */
const weeksIn = (weeks: readonly string[], from: string, to: string): number =>
  weeks.filter((week) => week >= from && week < to).length;

/** The distinct weeks the athlete trained, plus the week in progress. */
const trainedWeeks = (
  completedDates: readonly string[],
  today: string,
): readonly string[] => [...new Set([...completedDates, today].map(weekStart))];
