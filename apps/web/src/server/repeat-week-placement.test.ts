import { describe, expect, it } from "bun:test";
import type { AthleteState } from "@titan/db/athlete-state";
import type { ProgramVersion, TrainingBlock } from "@titan/domain/program";
import type { WorkoutSession } from "@titan/domain/workout-session";
import { repeatWeekPlacement } from "./repeat-week-placement";

const block = (id: string, durationWeeks: number): TrainingBlock => ({
  durationWeeks,
  id,
  name: id,
  weekTemplate: { days: [] },
});

const version: ProgramVersion = {
  blocks: [block("base", 4), block("build", 6)],
  createdAt: "2026-01-01T00:00:00.000Z",
  id: "v1",
  programId: "p1",
  sessionTemplates: [],
  version: 1,
};

const state: AthleteState = {
  absoluteWeek: 1,
  placedOn: "2026-08-10",
  programVersionId: "v1",
  updatedAt: "2026-08-10T00:00:00.000Z",
  userId: "u1",
};

/** The second week of the build block, trained the week of Mon 2026-09-07. */
const session = {
  blockId: "build",
  scheduledDate: "2026-09-09",
  weekNumber: 2,
} as WorkoutSession;

describe("repeatWeekPlacement", () => {
  it("re-places the athlete on the week just trained, from the week after it", () => {
    expect(
      repeatWeekPlacement(state, version, session, "2026-09-13T18:00:00.000Z"),
    ).toEqual({
      absoluteWeek: 6,
      placedOn: "2026-09-14",
      programVersionId: "v1",
      updatedAt: "2026-09-13T18:00:00.000Z",
      userId: "u1",
    });
  });
});
