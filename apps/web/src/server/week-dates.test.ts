import { describe, expect, it } from "bun:test";
import { dayLabel, weekDates } from "./week-dates";

describe("weekDates", () => {
  it("returns Monday-through-Sunday of the ISO week containing the date", () => {
    expect(weekDates("2026-08-12")).toEqual([
      "2026-08-10",
      "2026-08-11",
      "2026-08-12",
      "2026-08-13",
      "2026-08-14",
      "2026-08-15",
      "2026-08-16",
    ]);
  });

  it("returns the same week from a Sunday", () => {
    expect(weekDates("2026-08-16")[0]).toBe("2026-08-10");
    expect(weekDates("2026-08-16").at(-1)).toBe("2026-08-16");
  });

  it("crosses a month boundary cleanly", () => {
    expect(weekDates("2026-09-01")).toEqual([
      "2026-08-31",
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
      "2026-09-05",
      "2026-09-06",
    ]);
  });

  it("pages forward and backward whole weeks by offset", () => {
    expect(weekDates("2026-08-12", 1)[0]).toBe("2026-08-17");
    expect(weekDates("2026-08-12", 1).at(-1)).toBe("2026-08-23");
    expect(weekDates("2026-08-12", -1)[0]).toBe("2026-08-03");
    expect(weekDates("2026-08-12", -2)[0]).toBe("2026-07-27");
  });
});

describe("dayLabel", () => {
  it("is an uppercase weekday abbreviation and the day of the month", () => {
    expect(dayLabel("2026-08-10")).toBe("MON 10");
    expect(dayLabel("2026-08-16")).toBe("SUN 16");
  });

  it("does not zero-pad the day of the month", () => {
    expect(dayLabel("2026-08-01")).toBe("SAT 1");
  });
});
