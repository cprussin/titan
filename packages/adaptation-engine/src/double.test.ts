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
    const bwBase = Prescription.Bodyweight({ reps: 6, sets: 3 });
    const bwPolicy = ProgressionPolicy.Double({
      increment: 5,
      maxReps: 8,
      minReps: 6,
      rpeCap: 8,
      sets: 3,
    });
    const last: ExerciseResult = {
      exerciseId: "pullup",
      id: "r-bw",
      prescription: Prescription.Bodyweight({ reps: 8, sets: 3 }),
      sets: Array.from({ length: 3 }, (_, setIndex) => ({
        completed: true,
        reps: 8,
        setIndex,
      })),
      slotId: "slot-pullup",
    };
    const outcome = progressDouble(bwPolicy, bwBase, [last]);
    expect(outcome.action).toBe("increase-load");
    expect(outcome.prescription).toMatchObject({ addedWeightLb: 5, reps: 6 });
  });
});
