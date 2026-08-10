import { describe, expect, it } from "bun:test";
import { generateWarmup } from "./warmup";

describe("generateWarmup", () => {
  it("returns no warm-up when the working weight is at or below the bar", () => {
    expect(generateWarmup(45, "lb")).toEqual([]);
    expect(generateWarmup(30, "lb")).toEqual([]);
  });

  it("starts from the empty bar and ramps up under the working weight", () => {
    const warmup = generateWarmup(225, "lb");
    expect(warmup[0]).toEqual({ reps: 5, weight: 45 });
    expect(warmup.every((set) => set.weight < 225)).toBe(true);
    const weights = warmup.map((set) => set.weight);
    // strictly ascending
    expect([...weights].sort((a, b) => a - b)).toEqual(weights);
  });

  it("rounds ramp loads to the nearest 5 lb", () => {
    const warmup = generateWarmup(225, "lb");
    expect(warmup.every((set) => set.weight % 5 === 0)).toBe(true);
  });

  it("collapses duplicate loads for a light working weight", () => {
    const warmup = generateWarmup(65, "lb");
    const weights = warmup.map((set) => set.weight);
    expect(new Set(weights).size).toBe(weights.length);
  });

  it("ramps a metric barbell from the 20 kg bar in 2.5 kg steps", () => {
    const warmup = generateWarmup(100, "kg");
    expect(warmup[0]).toEqual({ reps: 5, weight: 20 });
    expect(warmup.every((set) => set.weight < 100)).toBe(true);
    expect(warmup.every((set) => (set.weight * 10) % 25 === 0)).toBe(true);
  });

  it("returns no warm-up for a metric load at or below the 20 kg bar", () => {
    expect(generateWarmup(20, "kg")).toEqual([]);
  });
});
