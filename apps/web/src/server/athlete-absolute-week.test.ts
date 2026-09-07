import { describe, expect, it } from "bun:test";
import type { AthleteState } from "@titan/db/athlete-state";
import { athleteAbsoluteWeek } from "./athlete-absolute-week";

const placed: AthleteState = {
  absoluteWeek: 1,
  placedOn: "2026-08-10",
  programVersionId: "v1",
  updatedAt: "2026-08-10T00:00:00.000Z",
  userId: "default",
};

const trainedOn = (scheduledDate: string) => ({
  programVersionId: "v1",
  scheduledDate,
});

/** Four trained weeks: Mon 2026-08-10 through Sun 2026-09-06. */
const completed = ["2026-08-12", "2026-08-19", "2026-08-26", "2026-09-02"].map(
  trainedOn,
);

describe("athleteAbsoluteWeek", () => {
  it("counts the weeks trained since the placement", () => {
    expect(
      athleteAbsoluteWeek(placed, completed, "2026-09-07", "2026-09-07"),
    ).toBe(5);
  });

  it("anchors a placement made before placements recorded a date on the first week trained", () => {
    const legacy: AthleteState = {
      ...placed,
      absoluteWeek: 4,
      placedOn: undefined,
    };
    expect(
      athleteAbsoluteWeek(legacy, completed, "2026-09-07", "2026-09-07"),
    ).toBe(5);
    expect(
      athleteAbsoluteWeek(legacy, completed, "2026-09-07", "2026-08-10"),
    ).toBe(1);
  });

  it("holds an untrained legacy placement at the program's first week", () => {
    const legacy: AthleteState = {
      ...placed,
      absoluteWeek: 4,
      placedOn: undefined,
    };
    expect(athleteAbsoluteWeek(legacy, [], "2026-09-07", "2026-09-07")).toBe(1);
  });

  it("counts only the weeks trained on the program the athlete is placed on", () => {
    const elsewhere = [
      { programVersionId: "other-v1", scheduledDate: "2026-07-15" },
      ...completed,
    ];
    expect(
      athleteAbsoluteWeek(placed, elsewhere, "2026-09-07", "2026-09-07"),
    ).toBe(5);
  });

  it("reads as the program's first week when no program is placed", () => {
    expect(
      athleteAbsoluteWeek(undefined, completed, "2026-09-07", "2026-09-07"),
    ).toBe(1);
  });
});
