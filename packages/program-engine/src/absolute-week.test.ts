import { describe, expect, it } from "bun:test";
import { absoluteWeekFor } from "./absolute-week";

/** Placed at the program's first week, in the calendar week of Mon 2026-08-10. */
const placement = { absoluteWeek: 1, placedOn: "2026-08-10" };

describe("absoluteWeekFor", () => {
  it("advances one week per calendar week the athlete trained", () => {
    expect(
      absoluteWeekFor(
        placement,
        ["2026-08-12", "2026-08-19", "2026-08-26", "2026-09-02"],
        "2026-09-07",
        "2026-09-07",
      ),
    ).toBe(5);
  });

  it("counts a trained week once however many sessions it holds", () => {
    expect(
      absoluteWeekFor(
        placement,
        ["2026-08-10", "2026-08-11", "2026-08-12"],
        "2026-08-17",
        "2026-08-17",
      ),
    ).toBe(2);
  });

  it("holds the week through calendar weeks with nothing logged", () => {
    expect(
      absoluteWeekFor(placement, ["2026-08-12"], "2026-09-07", "2026-09-07"),
    ).toBe(2);
  });

  it("counts the week in progress, so the week ahead reads one further on", () => {
    expect(
      absoluteWeekFor(placement, ["2026-08-12"], "2026-08-17", "2026-08-24"),
    ).toBe(3);
  });

  it("projects past weeks back to the position they were trained at", () => {
    const completed = ["2026-08-12", "2026-08-19", "2026-08-26", "2026-09-02"];
    expect(
      absoluteWeekFor(placement, completed, "2026-09-07", "2026-08-10"),
    ).toBe(1);
    expect(
      absoluteWeekFor(placement, completed, "2026-09-07", "2026-08-26"),
    ).toBe(3);
  });

  it("counts back from a placement made mid-program", () => {
    expect(
      absoluteWeekFor(
        { absoluteWeek: 5, placedOn: "2026-09-07" },
        ["2026-09-02"],
        "2026-09-07",
        "2026-08-31",
      ),
    ).toBe(4);
  });
});
