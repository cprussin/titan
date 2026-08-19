import { describe, expect, it } from "bun:test";
import {
  formatBodyWeight,
  formatClock,
  formatDistance,
  formatDuration,
  formatSignedClock,
  formatSplit,
  formatSplitClock,
  formatWeight,
  formatWeightRange,
  parseDuration,
  snapWeight,
} from "./format";

describe("formatters", () => {
  it("formats weight, dropping trailing zeros", () => {
    expect(formatWeight(230)).toBe("230 lb");
    expect(formatWeight(202.5)).toBe("202.5 lb");
  });

  it("formats a body weight to the tenth a scale reads", () => {
    expect(formatBodyWeight(172)).toBe("172 lb");
    expect(formatBodyWeight(172.4)).toBe("172.4 lb");
    expect(formatBodyWeight(150.2)).toBe("150.2 lb");
    expect(formatBodyWeight(150.25)).toBe("150.3 lb");
  });

  it("formats a weight in its given unit", () => {
    expect(formatWeight(100, "kg")).toBe("100 kg");
    expect(formatWeight(92.5, "kg")).toBe("92.5 kg");
    expect(formatWeight(230, "lb")).toBe("230 lb");
  });

  it("formats a range of loads, collapsing a single load to one figure", () => {
    expect(formatWeightRange(225, 225, "lb")).toBe("225 lb");
    expect(formatWeightRange(225, 232.5, "lb")).toBe("225–232.5 lb");
    expect(formatWeightRange(100, 102.5, "kg")).toBe("100–102.5 kg");
  });

  it("snaps a load to the half the display grid works in", () => {
    expect(snapWeight(99.8)).toBe(100);
    expect(snapWeight(102.4)).toBe(102.5);
    expect(snapWeight(225)).toBe(225);
  });

  it("formats a rest clock as m:ss", () => {
    expect(formatClock(90)).toBe("1:30");
    expect(formatClock(5)).toBe("0:05");
  });

  it("formats a signed clock, marking overtime past zero with a minus", () => {
    expect(formatSignedClock(90)).toBe("1:30");
    expect(formatSignedClock(0)).toBe("0:00");
    expect(formatSignedClock(-5)).toBe("-0:05");
    expect(formatSignedClock(-95)).toBe("-1:35");
  });

  it("formats a rowing split", () => {
    expect(formatSplit(105)).toBe("1:45.0 /500m");
  });

  it("formats a bare split clock without the unit", () => {
    expect(formatSplitClock(112)).toBe("1:52.0");
  });

  it("formats distance to the whole metre, grouping thousands", () => {
    expect(formatDistance(500)).toBe("500 m");
    // A time-based piece (a 10-minute row) covers an arbitrary distance the
    // athlete needs to the metre — not snapped to the nearest half-kilometre.
    expect(formatDistance(2734)).toBe("2,734 m");
    expect(formatDistance(2000)).toBe("2,000 m");
    expect(formatDistance(10_000)).toBe("10,000 m");
  });

  describe("formatDuration", () => {
    it("shows tenths and no minutes for a sub-minute piece", () => {
      expect(formatDuration(45.3)).toBe("45.3");
      expect(formatDuration(9.4)).toBe("9.4");
      expect(formatDuration(5)).toBe("5.0");
    });

    it("shows m:ss.s for a piece from one to ten minutes", () => {
      expect(formatDuration(443.4)).toBe("7:23.4");
      expect(formatDuration(90)).toBe("1:30.0");
      expect(formatDuration(65)).toBe("1:05.0");
    });

    it("drops tenths for a piece of ten minutes or longer", () => {
      expect(formatDuration(2400)).toBe("40:00");
      expect(formatDuration(605.7)).toBe("10:06");
      expect(formatDuration(600)).toBe("10:00");
    });

    it("carries a rounded second up into the minute", () => {
      expect(formatDuration(119.98)).toBe("2:00.0");
      expect(formatDuration(59.98)).toBe("1:00.0");
    });
  });

  describe("parseDuration", () => {
    it("parses m:ss and m:ss.s into seconds", () => {
      expect(parseDuration("7:23.4")).toBe(443.4);
      expect(parseDuration("0:05")).toBe(5);
      expect(parseDuration("30:00")).toBe(1800);
    });

    it("parses a bare value as seconds", () => {
      expect(parseDuration("45.3")).toBe(45.3);
    });

    it("returns undefined for blank input", () => {
      expect(parseDuration("")).toBeUndefined();
      expect(parseDuration("   ")).toBeUndefined();
    });

    it("returns undefined for malformed input", () => {
      expect(parseDuration("abc")).toBeUndefined();
      expect(parseDuration("1:2:3")).toBeUndefined();
      expect(parseDuration("6:75")).toBeUndefined();
      expect(parseDuration("6:")).toBeUndefined();
      expect(parseDuration(":30")).toBeUndefined();
    });
  });
});
