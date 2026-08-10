import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import type { ExerciseSlot } from "@titan/domain/program";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import type { ExerciseResult } from "@titan/domain/result";
import { projectNextAdaptations } from "./next-adaptations";

const squatSlot: ExerciseSlot = {
  base: Prescription.Strength({
    reps: 5,
    rpeTarget: 8.5,
    sets: 5,
    weight: 225,
  }),
  exerciseId: "back-squat",
  generateWarmup: true,
  id: "squat",
  progression: ProgressionPolicy.Linear({
    increment: 5,
    missesBeforeDeload: 2,
    reps: 5,
    retainOnDeload: 0.9,
    rpeCap: 8.5,
    sets: 5,
  }),
  role: "primary",
};

const curlSlot: ExerciseSlot = {
  base: Prescription.Strength({
    reps: 10,
    rpeTarget: 8,
    sets: 3,
    weight: 40,
  }),
  exerciseId: "db-curl",
  generateWarmup: false,
  id: "curl",
  progression: ProgressionPolicy.None(),
  role: "accessory",
};

const metSquat = (weight: number): ExerciseResult => ({
  exerciseId: "back-squat",
  id: `r-${weight}`,
  prescription: Prescription.Strength({ reps: 5, sets: 5, weight }),
  sets: Array.from({ length: 5 }, (_, setIndex) => ({
    completed: true,
    reps: 5,
    rpe: 7.5,
    setIndex,
  })),
  slotId: "squat",
});

describe("projectNextAdaptations", () => {
  it("marks a met linear lift as progressed with its forward explanation", () => {
    const [adaptation] = projectNextAdaptations([squatSlot], (slotId) =>
      slotId === "squat" ? [metSquat(225)] : [],
    );

    expect(adaptation).toEqual({
      action: "increase-load",
      exerciseId: "back-squat",
      explanation: expect.stringContaining("Increase"),
      progressed: true,
      slotId: "squat",
    });
  });

  it("holds a non-progressing slot", () => {
    const [adaptation] = projectNextAdaptations([curlSlot], () => []);

    expect(adaptation?.action).toBe("maintain");
    expect(adaptation?.progressed).toBe(false);
  });

  it("projects one adaptation per slot, in order", () => {
    const adaptations = projectNextAdaptations(
      [squatSlot, curlSlot],
      (slotId) => (slotId === "squat" ? [metSquat(225)] : []),
    );

    expect(adaptations.map((entry) => entry.slotId)).toEqual(["squat", "curl"]);
  });
});
