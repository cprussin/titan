import { describe, expect, it } from "bun:test";
import type { Db } from "@titan/db/client";
import type {
  ProgramVersion,
  SessionTemplate,
  TrainingBlock,
} from "@titan/domain/program";
import { deleteBlock } from "./delete-block";

const db = {} as Db;

const template = (id: string): SessionTemplate => ({
  constraints: {},
  id,
  name: id,
  tags: [],
  targetDurationMin: 30,
});

const block = (id: string, sessionTemplateId: string): TrainingBlock => ({
  durationWeeks: 4,
  id,
  name: id,
  weekTemplate: { days: [{ dayOfWeek: 1, sessionTemplateId }] },
});

const version: ProgramVersion = {
  blocks: [block("a", "t1"), block("b", "t2")],
  createdAt: "2026-01-01T00:00:00.000Z",
  id: "v1",
  programId: "p1",
  sessionTemplates: [template("t1"), template("t2")],
  version: 1,
};

describe("deleteBlock", () => {
  it("mints a new version without the block, pruning now-unreferenced templates", async () => {
    const saved: ProgramVersion[] = [];
    await deleteBlock(
      db,
      "v1",
      "a",
      () => Promise.resolve(version),
      (_db, minted) => {
        saved.push(minted);
        return Promise.resolve();
      },
      () => "v2",
      () => "2026-08-09T00:00:00.000Z",
    );
    expect(saved).toEqual([
      {
        blocks: [block("b", "t2")],
        createdAt: "2026-08-09T00:00:00.000Z",
        id: "v2",
        programId: "p1",
        sessionTemplates: [template("t2")],
        version: 2,
      },
    ]);
  });

  it("throws when the block is not part of the version", async () => {
    await expect(
      deleteBlock(
        db,
        "v1",
        "missing",
        () => Promise.resolve(version),
        () => Promise.resolve(),
        () => "v2",
        () => "2026-08-09T00:00:00.000Z",
      ),
    ).rejects.toThrow("missing");
  });

  it("throws when the version does not exist", async () => {
    await expect(
      deleteBlock(
        db,
        "gone",
        "a",
        () => Promise.resolve(undefined),
        () => Promise.resolve(),
        () => "v2",
        () => "2026-08-09T00:00:00.000Z",
      ),
    ).rejects.toThrow("gone");
  });
});
