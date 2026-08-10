import { describe, expect, it } from "bun:test";
import {
  formatClock,
  formatDistance,
  formatSplit,
  formatWeight,
} from "./format";

describe("formatters", () => {
  it("formats weight, dropping trailing zeros", () => {
    expect(formatWeight(230)).toBe("230 lb");
    expect(formatWeight(202.5)).toBe("202.5 lb");
  });

  it("formats a weight in its given unit", () => {
    expect(formatWeight(100, "kg")).toBe("100 kg");
    expect(formatWeight(92.5, "kg")).toBe("92.5 kg");
    expect(formatWeight(230, "lb")).toBe("230 lb");
  });

  it("formats a rest clock as m:ss", () => {
    expect(formatClock(90)).toBe("1:30");
    expect(formatClock(5)).toBe("0:05");
  });

  it("formats a rowing split", () => {
    expect(formatSplit(105)).toBe("1:45.0 /500m");
  });

  it("formats distance in m and km", () => {
    expect(formatDistance(500)).toBe("500 m");
    expect(formatDistance(2000)).toBe("2 km");
  });
});
