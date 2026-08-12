import { describe, expect, it } from "bun:test";
import { dateIso, isoDayOfWeek } from "./date";

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
