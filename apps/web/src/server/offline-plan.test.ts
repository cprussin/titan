import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import type {
  ExerciseSlot,
  ProgramVersion,
  SessionTemplate,
} from "@titan/domain/program";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import { offlinePlan } from "./offline-plan";

const slot = (id: string, exerciseId: string): ExerciseSlot => ({
  base: Prescription.Strength({ reps: 5, sets: 5, weight: 100 }),
  exerciseId,
  generateWarmup: false,
  id,
  progression: ProgressionPolicy.None(),
  role: "primary",
});

const heavyLower: SessionTemplate = {
  constraints: {},
  id: "heavy-lower",
  name: "Heavy Lower",
  slots: [slot("squat-slot", "squat")],
  tags: [],
  targetDurationMin: 60,
};

const easyCardio: SessionTemplate = {
  alternatives: [
    { id: "row", label: "Row", slots: [slot("row-slot", "row")] },
    { id: "bike", label: "Bike", slots: [slot("bike-slot", "bike")] },
  ],
  constraints: {},
  id: "easy-cardio",
  name: "Long Easy Cardio",
  tags: [],
  targetDurationMin: 45,
};

const version: ProgramVersion = {
  blocks: [
    {
      durationWeeks: 4,
      id: "block",
      name: "Block",
      weekTemplate: {
        days: [
          { dayOfWeek: 1, sessionTemplateId: "heavy-lower" },
          { dayOfWeek: 2, sessionTemplateId: "easy-cardio" },
        ],
      },
    },
  ],
  createdAt: "2026-01-01T00:00:00.000Z",
  id: "v1",
  programId: "p",
  sessionTemplates: [heavyLower, easyCardio],
  version: 1,
};

// 2026-08-10 is a Monday, 2026-08-11 a Tuesday, 2026-08-12 a Wednesday.
const plan = offlinePlan({
  absoluteWeekFor: () => 1,
  dates: ["2026-08-10", "2026-08-11", "2026-08-12"],
  historyBySlot: () => [],
  programVersion: version,
});

describe("offlinePlan", () => {
  it("resolves each training day to a startable session", () => {
    expect(plan.map((day) => [day.date, day.templateName])).toEqual([
      ["2026-08-10", "Heavy Lower"],
      ["2026-08-11", "Long Easy Cardio"],
    ]);
  });

  it("offers a single unlabelled option for a session with one shape", () => {
    const [monday] = plan;
    expect(monday?.options.map((option) => option.alternativeId)).toEqual([
      undefined,
    ]);
    expect(
      monday?.options[0]?.prescribedExercises.map((entry) => entry.slotId),
    ).toEqual(["squat-slot"]);
  });

  it("resolves every alternative of a session that offers a choice", () => {
    const tuesday = plan[1];
    expect(
      tuesday?.options.map((option) => [
        option.alternativeId,
        option.label,
        option.prescribedExercises.map((entry) => entry.exerciseId),
      ]),
    ).toEqual([
      ["row", "Row", ["row"]],
      ["bike", "Bike", ["bike"]],
    ]);
  });

  it("carries why each exercise's target is what it is", () => {
    const [monday] = plan;
    expect(Object.keys(monday?.options[0]?.explanations ?? {})).toEqual([
      "squat",
    ]);
  });
});
