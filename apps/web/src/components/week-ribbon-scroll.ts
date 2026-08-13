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

/** The `scrollLeft` that centers a cell — sitting `cellOffset` from the strip's
 *  start and `cellWidth` wide — in a `viewportWidth`-wide viewport, clamped so
 *  the strip never scrolls before its start or past `maxScrollLeft`. */
export const centeredScrollLeft = ({
  cellOffset,
  cellWidth,
  maxScrollLeft,
  viewportWidth,
}: {
  cellOffset: number;
  cellWidth: number;
  maxScrollLeft: number;
  viewportWidth: number;
}): number => {
  const target = cellOffset + cellWidth / 2 - viewportWidth / 2;
  return Math.min(maxScrollLeft, Math.max(0, target));
};

/** The `scrollLeft` that pages the strip by whole day cells and leaves it flush
 *  on a cell boundary. The strip's cells are uniform, so cell `i` starts at
 *  `firstStart + i·stride`. From the cell nearest the current `scrollLeft`, this
 *  shifts by `shift` cells (negative pages earlier) and brings that cell flush to
 *  the viewport's start, clamped to the strip. A `shift` of 0 simply re-aligns —
 *  used after a resize changes the cell widths — while ±the visible-day count
 *  pages by exactly one screenful of days, the same distance on every click. */
export const alignedScrollLeft = ({
  cellCount,
  firstStart,
  maxScrollLeft,
  scrollLeft,
  shift,
  stride,
}: {
  cellCount: number;
  firstStart: number;
  maxScrollLeft: number;
  scrollLeft: number;
  shift: number;
  stride: number;
}): number => {
  const nearest = Math.round((scrollLeft - firstStart) / stride);
  const target = Math.min(cellCount - 1, Math.max(0, nearest + shift));
  return Math.min(maxScrollLeft, Math.max(0, firstStart + target * stride));
};

/** The `scrollLeft` that keeps the currently-shown cells in place after a week
 *  is prepended to the strip: prepending grows the content before the viewport
 *  by the width the new cells added, so the scroll offset shifts by that much. */
export const scrollLeftAfterPrepend = ({
  newScrollWidth,
  oldScrollWidth,
  scrollLeft,
}: {
  newScrollWidth: number;
  oldScrollWidth: number;
  scrollLeft: number;
}): number => scrollLeft + (newScrollWidth - oldScrollWidth);
