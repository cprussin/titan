import { describe, expect, it } from "bun:test";
import type { ProgramVersion, TrainingBlock } from "@titan/domain/program";
import { activeBlockId, blockStartWeek, isActiveBlock } from "./active-block";

const block = (id: string, durationWeeks: number): TrainingBlock => ({
  durationWeeks,
  id,
  name: id,
  weekTemplate: { days: [] },
});

const version: ProgramVersion = {
  blocks: [block("base", 4), block("build", 6), block("peak", 3)],
  createdAt: "2026-01-01T00:00:00.000Z",
  id: "v1",
  programId: "p1",
  sessionTemplates: [],
  version: 1,
};

describe("blockStartWeek", () => {
  it("returns week 1 for the first block", () => {
    expect(blockStartWeek(version, "base")).toBe(1);
  });

  it("sums the durations of the preceding blocks for later blocks", () => {
    expect(blockStartWeek(version, "build")).toBe(5);
    expect(blockStartWeek(version, "peak")).toBe(11);
  });

  it("throws when the block is not part of the version", () => {
    expect(() => blockStartWeek(version, "ghost")).toThrow("ghost");
  });
});

describe("activeBlockId", () => {
  it("locates the block whose week window contains the absolute week", () => {
    expect(activeBlockId(version, 1)).toBe("base");
    expect(activeBlockId(version, 4)).toBe("base");
    expect(activeBlockId(version, 5)).toBe("build");
    expect(activeBlockId(version, 10)).toBe("build");
    expect(activeBlockId(version, 11)).toBe("peak");
    expect(activeBlockId(version, 13)).toBe("peak");
  });

  it("returns undefined once the program's blocks are exhausted", () => {
    expect(activeBlockId(version, 14)).toBeUndefined();
  });

  it("returns undefined for a week before the program starts", () => {
    expect(activeBlockId(version, 0)).toBeUndefined();
  });
});

describe("isActiveBlock", () => {
  const state = { absoluteWeek: 6, programVersionId: "v1" };

  it("is true for the block holding the athlete's week in the active version", () => {
    expect(isActiveBlock(state, version, "build")).toBe(true);
  });

  it("is false for other blocks of the active version", () => {
    expect(isActiveBlock(state, version, "base")).toBe(false);
  });

  it("is false when the athlete's active version is a different one", () => {
    expect(
      isActiveBlock(
        { absoluteWeek: 6, programVersionId: "other" },
        version,
        "build",
      ),
    ).toBe(false);
  });

  it("is false when there is no athlete state", () => {
    expect(isActiveBlock(undefined, version, "build")).toBe(false);
  });
});
