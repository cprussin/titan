import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import type {
  ExerciseSlot,
  Program,
  ProgramVersion,
  SessionTemplate,
  TrainingBlock,
} from "@titan/domain/program";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import {
  blockSchedule,
  findBlockContext,
  latestPrograms,
  sessionRotations,
} from "./program-explorer";

const slot = (id: string): ExerciseSlot => ({
  base: Prescription.Strength({ reps: 5, sets: 3, weightLb: 100 }),
  exerciseId: `${id}-exercise`,
  generateWarmup: false,
  id,
  progression: ProgressionPolicy.None(),
  role: "primary",
});

const push: SessionTemplate = {
  constraints: {},
  id: "push",
  name: "Push",
  slots: [slot("push-bench")],
  tags: [],
  targetDurationMin: 45,
};

const rowIntervals: SessionTemplate = {
  constraints: {},
  id: "row",
  name: "Row Intervals",
  tags: [],
  targetDurationMin: 40,
  variants: [
    { label: "Week A", slots: [slot("row-a")] },
    { label: "Week B", slots: [slot("row-b")] },
  ],
};

const block: TrainingBlock = {
  durationWeeks: 4,
  id: "base-block",
  name: "Base",
  weekTemplate: {
    days: [
      { dayOfWeek: 3, sessionTemplateId: "row" },
      { dayOfWeek: 1, sessionTemplateId: "push" },
    ],
  },
};

const betaV2: ProgramVersion = {
  blocks: [block],
  createdAt: "2026-01-01T00:00:00.000Z",
  id: "beta-v2",
  programId: "beta",
  sessionTemplates: [push, rowIntervals],
  version: 2,
};

const betaV1: ProgramVersion = { ...betaV2, id: "beta-v1", version: 1 };

const alphaV1: ProgramVersion = {
  ...betaV2,
  id: "alpha-v1",
  programId: "alpha",
  version: 1,
};

const beta: Program = {
  description: "Beta description",
  goals: ["Get strong"],
  id: "beta",
  name: "Beta",
};

const alpha: Program = { ...beta, id: "alpha", name: "Alpha" };

const orphan: Program = { ...beta, id: "orphan", name: "Orphan" };

describe("latestPrograms", () => {
  it("pairs each program with its highest version, sorted by name", () => {
    const result = latestPrograms(
      [beta, alpha, orphan],
      [betaV1, betaV2, alphaV1],
    );
    expect(result.map((entry) => entry.program.name)).toEqual([
      "Alpha",
      "Beta",
    ]);
    expect(result.map((entry) => entry.version.id)).toEqual([
      "alpha-v1",
      "beta-v2",
    ]);
  });
});

describe("blockSchedule", () => {
  it("resolves each day to its template, ordered by weekday", () => {
    const schedule = blockSchedule(betaV2, block);
    expect(
      schedule.map((entry) => [entry.dayOfWeek, entry.template.name]),
    ).toEqual([
      [1, "Push"],
      [3, "Row Intervals"],
    ]);
  });

  it("throws when a scheduled template is missing from the version", () => {
    const broken: TrainingBlock = {
      ...block,
      weekTemplate: { days: [{ dayOfWeek: 1, sessionTemplateId: "ghost" }] },
    };
    expect(() => blockSchedule(betaV2, broken)).toThrow("ghost");
  });
});

describe("sessionRotations", () => {
  it("returns a single unlabeled rotation for a fixed template", () => {
    const rotations = sessionRotations(push);
    expect(rotations).toHaveLength(1);
    expect(rotations[0]?.label).toBeUndefined();
    expect(rotations[0]?.slots.map((entry) => entry.id)).toEqual([
      "push-bench",
    ]);
  });

  it("returns one labeled rotation per variant for a rotating template", () => {
    const rotations = sessionRotations(rowIntervals);
    expect(rotations.map((entry) => entry.label)).toEqual(["Week A", "Week B"]);
    expect(rotations.flatMap((entry) => entry.slots.map((s) => s.id))).toEqual([
      "row-a",
      "row-b",
    ]);
  });
});

describe("findBlockContext", () => {
  it("returns the program, version, and block when all resolve", () => {
    const context = findBlockContext(
      [alpha, beta],
      [alphaV1, betaV2],
      "beta-v2",
      "base-block",
    );
    expect(context?.program.name).toBe("Beta");
    expect(context?.version.id).toBe("beta-v2");
    expect(context?.block.name).toBe("Base");
  });

  it("returns undefined when the block is not in the version", () => {
    expect(
      findBlockContext([beta], [betaV2], "beta-v2", "missing"),
    ).toBeUndefined();
  });

  it("returns undefined when the version does not exist", () => {
    expect(
      findBlockContext([beta], [betaV2], "nope", "base-block"),
    ).toBeUndefined();
  });
});
