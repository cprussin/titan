import { describe, expect, it } from "bun:test";
import { dateIso, isoDayOfWeek } from "./date";

describe("dateIso", () => {
  it("formats a date as YYYY-MM-DD in UTC", () => {
    expect(dateIso(new Date("2026-01-05T10:30:00.000Z"))).toBe("2026-01-05");
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
