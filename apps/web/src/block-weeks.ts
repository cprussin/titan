/** A week's standing within its training block, relative to the current week. */
export type WeekState = "complete" | "current" | "upcoming";

/**
 * Per-week progress markers for a training block: one entry per week in block
 * order, each flagged relative to the current 1-based `weekInBlock`. Feeds a
 * left-to-right progress track that shows how far through the block the athlete
 * is at a glance.
 */
export const blockWeeks = (
  weekInBlock: number,
  durationWeeks: number,
): readonly WeekState[] =>
  Array.from({ length: durationWeeks }, (_, index) => {
    const week = index + 1;
    if (week < weekInBlock) {
      return "complete";
    } else if (week === weekInBlock) {
      return "current";
    } else {
      return "upcoming";
    }
  });
