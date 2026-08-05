import { describe, expect, it } from "bun:test";
import { estimateOneRepMax } from "./one-rep-max";

describe("estimateOneRepMax", () => {
  it("returns the lifted weight for a single rep", () => {
    expect(estimateOneRepMax(225, 1)).toBe(225);
  });

  it("applies the Epley formula for multiple reps", () => {
    // 100 * (1 + 5/30) = 116.66…
    expect(estimateOneRepMax(100, 5)).toBeCloseTo(116.667, 3);
  });

  it("scales with reps monotonically", () => {
    expect(estimateOneRepMax(100, 8)).toBeGreaterThan(
      estimateOneRepMax(100, 5),
    );
  });

  it("throws on a non-positive rep count", () => {
    expect(() => estimateOneRepMax(100, 0)).toThrow();
  });
});
