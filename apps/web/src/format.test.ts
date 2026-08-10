import { describe, expect, it } from "bun:test";
import {
  formatClock,
  formatDistance,
  formatDuration,
  formatSplit,
  formatWeight,
  parseDuration,
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
