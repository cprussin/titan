import { describe, expect, it } from "bun:test";
import { selectDate, selectWeek } from "./dashboard-params";

describe("selectDate", () => {
  it("takes a valid date", () => {
    expect(selectDate("2026-10-20", "2026-10-26")).toBe("2026-10-20");
  });

  it("falls back to today for a missing or malformed date", () => {
    expect(selectDate(undefined, "2026-10-26")).toBe("2026-10-26");
    expect(selectDate("yesterday", "2026-10-26")).toBe("2026-10-26");
  });
});

describe("selectWeek", () => {
  it("takes an integer offset", () => {
    expect(selectWeek("-2")).toBe(-2);
  });

  it("falls back to the current week otherwise", () => {
    expect(selectWeek(undefined)).toBe(0);
    expect(selectWeek("1.5")).toBe(0);
  });
});
