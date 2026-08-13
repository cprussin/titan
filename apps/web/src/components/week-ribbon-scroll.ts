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
