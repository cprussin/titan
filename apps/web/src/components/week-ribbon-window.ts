/** The pure geometry and paging math behind the dashboard's day strip. The strip
 *  itself owns the DOM; these functions decide how many days fit, where the
 *  window opens, how far a page moves it, and which neighbouring days to
 *  prefetch — none of which needs a browser, so all of it is unit-tested here.
 *
 *  Days are addressed by their integer offset from today: 0 is today, +1
 *  tomorrow, −1 yesterday. */

/** A `YYYY-MM-DD` date at UTC midnight, so day arithmetic is free of time-zone
 *  and DST drift (dates are already the athlete's local calendar day). */
const atUtcMidnight = (date: string): number =>
  new Date(`${date}T00:00:00.000Z`).getTime();

const MS_PER_DAY = 86_400_000;

/** How many whole day cells fit in `containerWidth`, given each cell needs at
 *  least `minCellWidth` and neighbouring cells are separated by `gap`. Solving
 *  `n·min + (n−1)·gap ≤ width` for `n` gives the `+ gap` on the numerator. Never
 *  fewer than one, never more than `dayCount`. */
export const visibleDayCount = ({
  containerWidth,
  dayCount,
  gap,
  minCellWidth,
}: {
  containerWidth: number;
  dayCount: number;
  gap: number;
  minCellWidth: number;
}): number => {
  const fit = Math.floor((containerWidth + gap) / (minCellWidth + gap));
  return Math.min(dayCount, Math.max(1, fit));
};

/** Whole days from `from` to `to` (positive when `to` is later). */
export const dayDiff = (from: string, to: string): number =>
  Math.round((atUtcMidnight(to) - atUtcMidnight(from)) / MS_PER_DAY);

/** The offset of the leftmost visible day when the strip first opens, placing
 *  today in the centre — or just left of centre when an even count leaves no
 *  exact middle. For `visibleDays` cells today sits at index
 *  `⌊(visibleDays − 1) / 2⌋`, so the left edge is that many days before it. */
export const initialLeftOffset = (visibleDays: number): number =>
  0 - Math.floor((visibleDays - 1) / 2);

/** The direction a strip arrow (or swipe) moves the window. */
export type PageDirection = "earlier" | "later";

/** The leftmost offset after paging one screenful — exactly `visibleDays`, so
 *  every page reveals a fresh, non-overlapping set the same distance away. */
export const pageLeftOffset = (
  leftOffset: number,
  visibleDays: number,
  direction: PageDirection,
): number =>
  direction === "later" ? leftOffset + visibleDays : leftOffset - visibleDays;

/** The leftmost offset that keeps the selected day at the same position within
 *  the window as it is re-fitted from `fromVisibleDays` to `toVisibleDays` cells.
 *  The selection holds its fractional place — a centred day stays centred, a day
 *  at the left edge stays at the left edge — instead of the left edge staying
 *  pinned and the selection drifting off the (now narrower) strip. */
export const resizeLeftOffset = ({
  fromVisibleDays,
  leftOffset,
  selectedOffset,
  toVisibleDays,
}: {
  fromVisibleDays: number;
  leftOffset: number;
  selectedOffset: number;
  toVisibleDays: number;
}): number => {
  const fraction = (selectedOffset - leftOffset) / fromVisibleDays;
  return Math.round(selectedOffset - fraction * toVisibleDays);
};

/** Which way a horizontal swipe pages the strip: dragging right-to-left
 *  (`deltaX` negative) pulls the future in, left-to-right sends it back. A drag
 *  shorter than `threshold` is a tap, not a swipe, so a day can still be
 *  selected by touch. */
export const swipeDirection = (
  deltaX: number,
  threshold: number,
): PageDirection | "none" => {
  switch (true) {
    case deltaX <= -threshold: {
      return "later";
    }
    case deltaX >= threshold: {
      return "earlier";
    }
    default: {
      return "none";
    }
  }
};

/** The offsets worth having loaded around a window whose left edge is at
 *  `leftOffset`: the previous page's first day through the next page's last, so
 *  a click in either direction reveals already-fetched days. */
export const bufferedOffsetRange = (
  leftOffset: number,
  visibleDays: number,
): { max: number; min: number } => ({
  max: leftOffset + 2 * visibleDays - 1,
  min: leftOffset - visibleDays,
});
