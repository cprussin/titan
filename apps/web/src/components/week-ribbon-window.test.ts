import { describe, expect, it } from "bun:test";
import {
  bufferedOffsetRange,
  dayDiff,
  initialLeftOffset,
  pageLeftOffset,
  swipeDirection,
  visibleDayCount,
} from "./week-ribbon-window";

describe(visibleDayCount, () => {
  it("counts the whole cells that fit, accounting for the gaps between them", () => {
    // 424px holds exactly three 136px cells plus their two 8px gaps.
    expect(
      visibleDayCount({
        containerWidth: 424,
        dayCount: 7,
        gap: 8,
        minCellWidth: 136,
      }),
    ).toBe(3);
  });

  it("never reports a partial day — a fourth cell needs its full width first", () => {
    // One pixel short of a fourth 136px cell (+ gap) still shows three.
    expect(
      visibleDayCount({
        containerWidth: 567,
        dayCount: 7,
        gap: 8,
        minCellWidth: 136,
      }),
    ).toBe(3);
    expect(
      visibleDayCount({
        containerWidth: 568,
        dayCount: 7,
        gap: 8,
        minCellWidth: 136,
      }),
    ).toBe(4);
  });

  it("always shows at least one day, even when none fully fits", () => {
    expect(
      visibleDayCount({
        containerWidth: 50,
        dayCount: 7,
        gap: 8,
        minCellWidth: 136,
      }),
    ).toBe(1);
  });

  it("never shows more days than exist", () => {
    expect(
      visibleDayCount({
        containerWidth: 5000,
        dayCount: 7,
        gap: 8,
        minCellWidth: 136,
      }),
    ).toBe(7);
  });
});

describe(dayDiff, () => {
  it("is zero for the same day", () => {
    expect(dayDiff("2026-08-13", "2026-08-13")).toBe(0);
  });

  it("counts whole days forward and backward", () => {
    expect(dayDiff("2026-08-13", "2026-08-16")).toBe(3);
    expect(dayDiff("2026-08-13", "2026-08-10")).toBe(-3);
  });

  it("spans month boundaries", () => {
    expect(dayDiff("2026-08-30", "2026-09-02")).toBe(3);
  });
});

describe(initialLeftOffset, () => {
  it("centers today for an odd number of days", () => {
    // N=5 → today at index 2, the middle: leftmost is two days before today.
    expect(initialLeftOffset(5)).toBe(-2);
    expect(initialLeftOffset(7)).toBe(-3);
    expect(initialLeftOffset(1)).toBe(0);
  });

  it("puts today just left of center for an even number of days", () => {
    // N=6 → today at index 2 (third of six): one left of the 2.5 midpoint.
    expect(initialLeftOffset(6)).toBe(-2);
    expect(initialLeftOffset(4)).toBe(-1);
  });
});

describe(pageLeftOffset, () => {
  it("advances a whole screenful of days into the future", () => {
    expect(pageLeftOffset(-1, 6, "later")).toBe(5);
    expect(pageLeftOffset(5, 6, "later")).toBe(11);
  });

  it("retreats a whole screenful of days into the past", () => {
    expect(pageLeftOffset(5, 6, "earlier")).toBe(-1);
    expect(pageLeftOffset(0, 3, "earlier")).toBe(-3);
  });
});

describe(swipeDirection, () => {
  it("advances to the future when swiped right-to-left past the threshold", () => {
    expect(swipeDirection(-50, 40)).toBe("later");
    expect(swipeDirection(-40, 40)).toBe("later");
  });

  it("goes back to the past when swiped left-to-right past the threshold", () => {
    expect(swipeDirection(50, 40)).toBe("earlier");
    expect(swipeDirection(40, 40)).toBe("earlier");
  });

  it("ignores a movement shorter than the threshold, so a tap still selects", () => {
    expect(swipeDirection(10, 40)).toBe("none");
    expect(swipeDirection(-39, 40)).toBe("none");
    expect(swipeDirection(0, 40)).toBe("none");
  });
});

describe(bufferedOffsetRange, () => {
  it("spans the previous page's start through the next page's end", () => {
    // Visible offsets 0..2; the prev page is -3..-1 and the next is 3..5.
    expect(bufferedOffsetRange(0, 3)).toEqual({ max: 5, min: -3 });
    expect(bufferedOffsetRange(-2, 6)).toEqual({ max: 9, min: -8 });
  });
});
