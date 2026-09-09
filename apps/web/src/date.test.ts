import { describe, expect, it } from "bun:test";
import { dateIso, formatCalendarDate, isoDayOfWeek } from "./date";

describe("dateIso", () => {
  it("formats an instant as YYYY-MM-DD in the given time zone", () => {
    expect(dateIso("UTC", new Date("2026-01-05T10:30:00.000Z"))).toBe(
      "2026-01-05",
    );
  });

  it("uses the visitor's local calendar day rather than UTC near midnight", () => {
    // 05:00 UTC on the 6th is 21:00 on the 5th in Los Angeles (UTC-8), so the
    // athlete is still on the 5th and must see the 5th's workout — not the
    // 6th's, which the old UTC-only computation would have shown.
    expect(
      dateIso("America/Los_Angeles", new Date("2026-01-06T05:00:00.000Z")),
    ).toBe("2026-01-05");
  });
});

describe("isoDayOfWeek", () => {
  it("maps Monday to 1", () => {
    expect(isoDayOfWeek("2026-01-05")).toBe(1);
  });

  it("maps Sunday to 7", () => {
    expect(isoDayOfWeek("2026-01-11")).toBe(7);
  });
});

describe("formatCalendarDate", () => {
  it("reads a YYYY-MM-DD date as an unambiguous short calendar date", () => {
    expect(formatCalendarDate("2026-09-09")).toBe("Sep 9, 2026");
  });

  it("reads the date as written rather than shifting it into local time", () => {
    // A naive `new Date("2026-01-01")` lands on UTC midnight, which is still
    // 2025 west of Greenwich — the label must stay on the day that was logged.
    expect(formatCalendarDate("2026-01-01")).toBe("Jan 1, 2026");
  });
});
