import { describe, expect, it } from "bun:test";
import { projectedSplitTimeSec, splitSecPer500 } from "./pace";

describe("splitSecPer500", () => {
  it("computes the per-500m split from distance and elapsed time", () => {
    // 2000m in 480s → 120s / 500m
    expect(splitSecPer500(2000, 480)).toBe(120);
  });

  it("handles distances shorter than 500m", () => {
    // 250m in 45s → 90s / 500m
    expect(splitSecPer500(250, 45)).toBe(90);
  });

  it("throws on a non-positive distance", () => {
    expect(() => splitSecPer500(0, 100)).toThrow();
  });
});

describe("projectedSplitTimeSec", () => {
  it("projects elapsed time for a distance at a given split", () => {
    // 500m/split over 2000m at 120s → 480s
    expect(projectedSplitTimeSec(2000, 120)).toBe(480);
  });

  it("round-trips with splitSecPer500", () => {
    const split = splitSecPer500(1000, 210);
    expect(projectedSplitTimeSec(1000, split)).toBeCloseTo(210, 6);
  });
});
