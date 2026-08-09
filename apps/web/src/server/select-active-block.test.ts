import { describe, expect, it } from "bun:test";
import type { AthleteState } from "@titan/db/athlete-state";
import type { Db } from "@titan/db/client";
import type { ProgramVersion, TrainingBlock } from "@titan/domain/program";
import { selectActiveBlock } from "./select-active-block";

const db = {} as Db;

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

describe("selectActiveBlock", () => {
  it("points the athlete's state at the version and the block's start week", async () => {
    const saved: AthleteState[] = [];
    await selectActiveBlock(
      db,
      "u1",
      "v1",
      "build",
      () => Promise.resolve(version),
      (_db, state) => {
        saved.push(state);
        return Promise.resolve();
      },
      () => "2026-08-09T00:00:00.000Z",
    );
    expect(saved).toEqual([
      {
        absoluteWeek: 5,
        programVersionId: "v1",
        updatedAt: "2026-08-09T00:00:00.000Z",
        userId: "u1",
      },
    ]);
  });

  it("throws when the requested version does not exist", async () => {
    await expect(
      selectActiveBlock(
        db,
        "u1",
        "missing",
        "build",
        () => Promise.resolve(undefined),
        () => Promise.resolve(),
      ),
    ).rejects.toThrow("missing");
  });
});
