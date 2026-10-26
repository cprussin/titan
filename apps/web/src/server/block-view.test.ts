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
import { blockView } from "./block-view";

const slot = (id: string): ExerciseSlot => ({
  base: Prescription.Strength({ reps: 5, sets: 3, weight: 100 }),
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
  slots: [slot("bench"), slot("press")],
  tags: [],
  targetDurationMin: 45,
};

const cardio: SessionTemplate = {
  alternatives: [
    { id: "row", label: "Row", slots: [slot("row")] },
    { id: "hike", label: "Hike", slots: [slot("hike")] },
  ],
  constraints: {},
  id: "cardio",
  name: "Cardio",
  tags: [],
  targetDurationMin: 60,
};

const block = (
  id: string,
  weekStructure: TrainingBlock["weekStructure"],
): TrainingBlock => ({
  durationWeeks: 2,
  id,
  name: `Block ${id}`,
  weekStructure,
  weekTemplate: {
    days: [
      { dayOfWeek: 1, sessionTemplateId: "push" },
      { dayOfWeek: 3, sessionTemplateId: "cardio" },
    ],
  },
});

const program: Program = {
  description: "",
  goals: [],
  id: "p",
  name: "Program",
};

const version = (blocks: TrainingBlock[]): ProgramVersion =>
  ({
    blocks,
    id: "p-v1",
    programId: "p",
    sessionTemplates: [push, cardio],
    version: 1,
  }) as unknown as ProgramVersion;

const names = new Map([["bench-exercise", "Bench"]]);

describe("blockView", () => {
  it("lays a progression block out by week, naming exercises and numbering slots", () => {
    const first = block("a", "progression");
    const view = blockView(
      {
        block: first,
        program,
        version: version([first, block("b", "repeating")]),
      },
      true,
      names,
    );
    expect(view.active).toBe(true);
    expect(view.programName).toBe("Program");
    expect(view.outcome).toEqual({
      blockId: "b",
      kind: "next",
      name: "Block b",
    });
    if (view.layout.kind === "weeks") {
      const [day] = view.layout.weeks[0]?.days ?? [];
      expect(day?.dayName).toBe("Monday");
      expect(day?.durationMin).toBe(45);
      expect(day?.content).toEqual({
        kind: "slots",
        slots: [
          {
            id: "bench",
            name: "Bench",
            position: 1,
            prescription: slot("bench").base,
            role: "primary",
          },
          {
            id: "press",
            name: "press-exercise",
            position: 2,
            prescription: slot("press").base,
            role: "primary",
          },
        ],
      });
    } else {
      throw new Error("expected weeks");
    }
  });

  it("lays a fixed block out by day, offering a template's alternatives", () => {
    const only = block("a", "repeating");
    const view = blockView(
      { block: only, program, version: version([only]) },
      false,
      names,
    );
    expect(view.outcome).toEqual({ kind: "repeats" });
    if (view.layout.kind === "fixed") {
      const content = view.layout.days[1]?.content;
      expect(content?.kind).toBe("options");
      if (content?.kind === "options") {
        expect(content.options.map((option) => option.label)).toEqual([
          "Row",
          "Hike",
        ]);
        expect(content.options[0]?.slots[0]?.position).toBeUndefined();
      }
    } else {
      throw new Error("expected fixed");
    }
  });
});
