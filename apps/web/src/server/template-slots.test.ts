import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import type { ExerciseSlot, SessionTemplate } from "@titan/domain/program";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import { templateSlotsById } from "./template-slots";

const slot = (id: string): ExerciseSlot => ({
  base: Prescription.Strength({ reps: 5, sets: 3, weight: 100 }),
  exerciseId: `ex-${id}`,
  generateWarmup: false,
  id,
  progression: ProgressionPolicy.None(),
  role: "primary",
});

const template = (shape: Partial<SessionTemplate>): SessionTemplate => ({
  constraints: {},
  id: "template",
  name: "Template",
  tags: [],
  targetDurationMin: 60,
  ...shape,
});

describe("templateSlotsById", () => {
  it("indexes a fixed session's own slots", () => {
    const indexed = templateSlotsById(template({ slots: [slot("squat")] }));
    expect([...indexed.keys()]).toEqual(["squat"]);
  });

  it("indexes every rotation's slots, whichever week ran", () => {
    const indexed = templateSlotsById(
      template({
        variants: [
          { label: "Week A", slots: [slot("a")] },
          { label: "Week B", slots: [slot("b")] },
        ],
      }),
    );
    expect([...indexed.keys()]).toEqual(["a", "b"]);
  });

  it("indexes every alternative's slots, whichever one was chosen", () => {
    const indexed = templateSlotsById(
      template({
        alternatives: [
          { id: "row", label: "Row", slots: [slot("row-slot")] },
          { id: "hike", label: "Hike", slots: [slot("hike-slot")] },
        ],
      }),
    );
    expect([...indexed.keys()]).toEqual(["row-slot", "hike-slot"]);
  });
});
