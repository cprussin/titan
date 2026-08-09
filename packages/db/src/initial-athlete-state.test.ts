import { describe, expect, it } from "bun:test";
import type { AthleteState } from "./athlete-state";
import { initialAthleteState } from "./initial-athlete-state";

const existing: AthleteState = {
  absoluteWeek: 7,
  programVersionId: "some-program-v1",
  updatedAt: "2026-06-01T00:00:00.000Z",
  userId: "default",
};

describe("initialAthleteState", () => {
  it("places a stateless athlete at week 1 of the first program", () => {
    expect(
      initialAthleteState(
        undefined,
        "athletic-health-foundation-v1",
        "default",
        "2026-01-01T00:00:00.000Z",
      ),
    ).toEqual({
      absoluteWeek: 1,
      programVersionId: "athletic-health-foundation-v1",
      updatedAt: "2026-01-01T00:00:00.000Z",
      userId: "default",
    });
  });

  it("never rewinds an athlete who already has state", () => {
    expect(
      initialAthleteState(
        existing,
        "athletic-health-foundation-v1",
        "default",
        "2026-01-01T00:00:00.000Z",
      ),
    ).toBeUndefined();
  });

  it("places nothing when there is no program to start", () => {
    expect(
      initialAthleteState(
        undefined,
        undefined,
        "default",
        "2026-01-01T00:00:00.000Z",
      ),
    ).toBeUndefined();
  });
});
