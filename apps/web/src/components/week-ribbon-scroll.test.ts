import { describe, expect, it } from "bun:test";
import { centeredScrollLeft, visibleDayCount } from "./week-ribbon-scroll";

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

describe(centeredScrollLeft, () => {
  it("centers the cell in the viewport", () => {
    expect(
      centeredScrollLeft({
        cellOffset: 300,
        cellWidth: 100,
        maxScrollLeft: 800,
        viewportWidth: 400,
      }),
    ).toBe(150);
  });

  it("clamps to the start rather than scrolling before it", () => {
    expect(
      centeredScrollLeft({
        cellOffset: 0,
        cellWidth: 100,
        maxScrollLeft: 800,
        viewportWidth: 400,
      }),
    ).toBe(0);
  });

  it("clamps to the end rather than scrolling past it", () => {
    expect(
      centeredScrollLeft({
        cellOffset: 1000,
        cellWidth: 100,
        maxScrollLeft: 800,
        viewportWidth: 400,
      }),
    ).toBe(800);
  });
});
