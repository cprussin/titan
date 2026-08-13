import { describe, expect, it } from "bun:test";
import {
  alignedScrollLeft,
  centeredScrollLeft,
  scrollLeftAfterPrepend,
  visibleDayCount,
} from "./week-ribbon-scroll";

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

describe(alignedScrollLeft, () => {
  // A seven-cell strip whose cells start at 0, 100, …, 600 (stride 100).
  const strip = {
    cellCount: 7,
    firstStart: 0,
    maxScrollLeft: 1000,
    stride: 100,
  };

  it("pages forward by a whole number of cells, the same on every click", () => {
    expect(alignedScrollLeft({ ...strip, scrollLeft: 0, shift: 3 })).toBe(300);
    expect(alignedScrollLeft({ ...strip, scrollLeft: 300, shift: 3 })).toBe(
      600,
    );
  });

  it("pages backward by the same amount", () => {
    expect(alignedScrollLeft({ ...strip, scrollLeft: 600, shift: -3 })).toBe(
      300,
    );
  });

  it("snaps a mid-cell offset to the nearest cell (a resize re-align)", () => {
    // 260 rounds up to cell 3 (300); 240 rounds down to cell 2 (200).
    expect(alignedScrollLeft({ ...strip, scrollLeft: 260, shift: 0 })).toBe(
      300,
    );
    expect(alignedScrollLeft({ ...strip, scrollLeft: 240, shift: 0 })).toBe(
      200,
    );
  });

  it("clamps to the last cell rather than paging past the end", () => {
    expect(alignedScrollLeft({ ...strip, scrollLeft: 500, shift: 3 })).toBe(
      600,
    );
  });

  it("clamps to maxScrollLeft rather than scrolling past the strip", () => {
    expect(
      alignedScrollLeft({
        cellCount: 20,
        firstStart: 0,
        maxScrollLeft: 850,
        scrollLeft: 800,
        shift: 3,
        stride: 100,
      }),
    ).toBe(850);
  });

  it("clamps to the start rather than paging before it", () => {
    expect(alignedScrollLeft({ ...strip, scrollLeft: 100, shift: -3 })).toBe(0);
  });

  it("accounts for a leading sentinel offset before the first cell", () => {
    // The first cell starts at 9 (a hidden sentinel plus its gap), so paging
    // three cells forward lands flush on the cell at 309.
    expect(
      alignedScrollLeft({
        cellCount: 7,
        firstStart: 9,
        maxScrollLeft: 1000,
        scrollLeft: 9,
        shift: 3,
        stride: 100,
      }),
    ).toBe(309);
  });
});

describe(scrollLeftAfterPrepend, () => {
  it("shifts the scroll by the width the prepended week added, holding the view still", () => {
    expect(
      scrollLeftAfterPrepend({
        newScrollWidth: 1400,
        oldScrollWidth: 1000,
        scrollLeft: 150,
      }),
    ).toBe(550);
  });

  it("is a no-op when nothing was added", () => {
    expect(
      scrollLeftAfterPrepend({
        newScrollWidth: 1000,
        oldScrollWidth: 1000,
        scrollLeft: 150,
      }),
    ).toBe(150);
  });
});
