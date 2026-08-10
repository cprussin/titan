import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import type { ExerciseSlot, SessionTemplate } from "@titan/domain/program";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import type { ExerciseResult } from "@titan/domain/result";
import { resolveSession } from "./resolve-session";

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

const template: SessionTemplate = {
  constraints: {},
  id: "heavy-lower",
  name: "Heavy Lower",
  slots: [squatSlot],
  tags: ["heavy-lower"],
  targetDurationMin: 60,
};

const metSession = (weight: number): ExerciseResult => ({
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

const noHistory = () => [];

describe("resolveSession", () => {
  it("prescribes the base with generated warm-ups on week 1", () => {
    const resolved = resolveSession({
      historyBySlot: noHistory,
      isDeloadWeek: false,
      template,
      weekInBlock: 1,
    });
    const [exercise] = resolved.prescribedExercises;
    expect(exercise?.prescription).toMatchObject({ weight: 225 });
    expect(exercise?.warmup?.length).toBeGreaterThan(0);
    expect(resolved.estimatedDurationMin).toBeGreaterThan(0);
    expect(resolved.variantLabel).toBeUndefined();
  });

  it("advances the load and records the decision when history warrants", () => {
    const resolved = resolveSession({
      historyBySlot: (slotId) => (slotId === "squat" ? [metSession(225)] : []),
      isDeloadWeek: false,
      template,
      weekInBlock: 2,
    });
    expect(resolved.prescribedExercises[0]?.prescription).toMatchObject({
      weight: 230,
    });
    expect(resolved.decisions[0]).toMatchObject({
      action: "increase-load",
      exerciseId: "back-squat",
    });
  });

  it("holds load and cuts volume on a deload week", () => {
    const resolved = resolveSession({
      historyBySlot: (slotId) => (slotId === "squat" ? [metSession(225)] : []),
      isDeloadWeek: true,
      template,
      weekInBlock: 4,
    });
    expect(resolved.prescribedExercises[0]?.prescription).toMatchObject({
      sets: 3,
      weight: 225,
    });
    expect(resolved.decisions[0]?.action).toBe("deload");
  });

  it("labels the chosen variant for a rotating session", () => {
    const rotating: SessionTemplate = {
      constraints: {},
      id: "row-intervals",
      name: "Row Intervals",
      tags: ["hard-row"],
      targetDurationMin: 50,
      variants: [
        {
          label: "Week A",
          slots: [
            {
              base: Prescription.Intervals({
                count: 6,
                recoverySec: 120,
                workDistanceMeters: 500,
              }),
              exerciseId: "row",
              generateWarmup: false,
              id: "row-slot",
              progression: ProgressionPolicy.None(),
              role: "primary",
            },
          ],
        },
      ],
    };
    const resolved = resolveSession({
      historyBySlot: noHistory,
      isDeloadWeek: false,
      template: rotating,
      weekInBlock: 1,
    });
    expect(resolved.variantLabel).toBe("Week A");
  });
});
