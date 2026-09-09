import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import type { ExerciseResult } from "@titan/domain/result";
import { progressDouble } from "./double";

const policy = ProgressionPolicy.Double({
  increment: 5,
  maxReps: 10,
  minReps: 8,
  rpeCap: 8,
  sets: 3,
});

const strengthResult = (
  weight: number,
  reps: number,
  opts: { completedReps?: number; lifted?: number; rpe?: number } = {},
): ExerciseResult => ({
  exerciseId: "rdl",
  id: `r-${weight}-${reps}`,
  prescription: Prescription.Strength({ reps, sets: 3, weight }),
  sets: Array.from({ length: 3 }, (_, setIndex) => ({
    completed: (opts.completedReps ?? reps) >= reps,
    reps: opts.completedReps ?? reps,
    rpe: opts.rpe,
    setIndex,
    ...(opts.lifted === undefined ? {} : { weight: opts.lifted }),
  })),
  slotId: "slot-rdl",
});

describe("progressDouble", () => {
  const base = Prescription.Strength({ reps: 8, sets: 3, weight: 185 });

  it("holds the base with no history", () => {
    expect(progressDouble(policy, base, []).prescription).toEqual(base);
  });

  it("adds a rep within the range when the target is met below the ceiling", () => {
    const outcome = progressDouble(policy, base, [strengthResult(185, 8)]);
    expect(outcome.action).toBe("increase-reps");
    expect(outcome.prescription).toMatchObject({ reps: 9, weight: 185 });
  });

  it("adds weight and resets reps once the top of the range is completed", () => {
    const outcome = progressDouble(policy, base, [
      strengthResult(185, 10, { rpe: 7 }),
    ]);
    expect(outcome.action).toBe("increase-load");
    expect(outcome.prescription).toMatchObject({ reps: 8, weight: 190 });
  });

  it("repeats the ceiling when RPE is over the cap", () => {
    const outcome = progressDouble(policy, base, [
      strengthResult(185, 10, { rpe: 9 }),
    ]);
    expect(outcome.action).toBe("repeat");
    expect(outcome.prescription).toMatchObject({ reps: 10, weight: 185 });
  });

  it("repeats when the target reps weren't completed", () => {
    const outcome = progressDouble(policy, base, [
      strengthResult(185, 8, { completedReps: 6 }),
    ]);
    expect(outcome.action).toBe("repeat");
    expect(outcome.prescription).toMatchObject({ reps: 8, weight: 185 });
  });

  it("adds weight off the load actually lifted when it exceeds the prescription", () => {
    const outcome = progressDouble(policy, base, [
      strengthResult(185, 10, { lifted: 195, rpe: 7 }),
    ]);
    expect(outcome.action).toBe("increase-load");
    expect(outcome.prescription).toMatchObject({ reps: 8, weight: 200 });
  });

  it("adds bodyweight load once a weighted-bodyweight ceiling is reached", () => {
    const outcome = progressDouble(
      bodyweightPolicy(5),
      Prescription.Bodyweight({ reps: 6, sets: 3 }),
      [bodyweightResult(Prescription.Bodyweight({ reps: 8, sets: 3 }))],
    );
    expect(outcome.action).toBe("increase-load");
    expect(outcome.prescription).toMatchObject({
      addedWeight: 5,
      reps: 6,
      unit: "lb",
    });
    expect(outcome.explanation).toContain("bodyweight +5 lb");
  });

  it("adds belt-loaded bodyweight load in the base's unit", () => {
    const outcome = progressDouble(
      bodyweightPolicy(2),
      Prescription.Bodyweight({ reps: 6, sets: 3, unit: "kg" }),
      [
        bodyweightResult(
          Prescription.Bodyweight({
            addedWeight: 10,
            reps: 8,
            sets: 3,
            unit: "kg",
          }),
        ),
      ],
    );
    expect(outcome.action).toBe("increase-load");
    expect(outcome.prescription).toMatchObject({
      addedWeight: 12,
      reps: 6,
      unit: "kg",
    });
    expect(outcome.explanation).toContain("bodyweight +12 kg");
  });
});

const bodyweightPolicy = (increment: number) =>
  ProgressionPolicy.Double({
    increment,
    maxReps: 8,
    minReps: 6,
    rpeCap: 8,
    sets: 3,
  });

const bodyweightResult = (
  prescription: ReturnType<typeof Prescription.Bodyweight>,
): ExerciseResult => ({
  exerciseId: "pullup",
  id: "r-bw",
  prescription,
  sets: Array.from({ length: 3 }, (_, setIndex) => ({
    completed: true,
    reps: prescription.reps,
    setIndex,
  })),
  slotId: "slot-pullup",
});
