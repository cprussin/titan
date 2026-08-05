import { describe, expect, it } from "bun:test";
import { generateWarmup } from "./warmup";

describe("generateWarmup", () => {
  it("returns no warm-up when the working weight is at or below the bar", () => {
    expect(generateWarmup(45)).toEqual([]);
    expect(generateWarmup(30)).toEqual([]);
  });

  it("starts from the empty bar and ramps up under the working weight", () => {
    const warmup = generateWarmup(225);
    expect(warmup[0]).toEqual({ reps: 5, weightLb: 45 });
    expect(warmup.every((set) => set.weightLb < 225)).toBe(true);
    const weights = warmup.map((set) => set.weightLb);
    // strictly ascending
    expect([...weights].sort((a, b) => a - b)).toEqual(weights);
  });

  it("rounds ramp loads to the nearest 5 lb", () => {
    const warmup = generateWarmup(225);
    expect(warmup.every((set) => set.weightLb % 5 === 0)).toBe(true);
  });

  it("collapses duplicate loads for a light working weight", () => {
    const warmup = generateWarmup(65);
    const weights = warmup.map((set) => set.weightLb);
    expect(new Set(weights).size).toBe(weights.length);
  });
});
