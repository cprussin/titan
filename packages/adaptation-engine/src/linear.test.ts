import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import type { ExerciseResult } from "@titan/domain/result";
import { progressLinear } from "./linear";

const policy = ProgressionPolicy.Linear({
  incrementLb: 5,
  missesBeforeDeload: 2,
  reps: 5,
  retainOnDeload: 0.9,
  rpeCap: 8.5,
  sets: 5,
});

const base = Prescription.Strength({
  reps: 5,
  rpeTarget: 8.5,
  sets: 5,
  weightLb: 225,
});

const session = (
  weightLb: number,
  opts: { reps?: number; rpe?: number },
): ExerciseResult => ({
  exerciseId: "back-squat",
  id: `r-${weightLb}-${opts.reps ?? 5}`,
  prescription: Prescription.Strength({ reps: 5, sets: 5, weightLb }),
  sets: Array.from({ length: 5 }, (_, setIndex) => ({
    completed: (opts.reps ?? 5) >= 5,
    reps: opts.reps ?? 5,
    rpe: opts.rpe,
    setIndex,
  })),
  slotId: "slot-squat",
});

describe("progressLinear", () => {
  it("holds the base weight with no history", () => {
    const outcome = progressLinear(policy, base, []);
    expect(outcome.action).toBe("maintain");
    expect(outcome.prescription).toEqual(base);
  });

  it("increases the load when all reps are completed under the RPE cap", () => {
    const outcome = progressLinear(policy, base, [session(225, { rpe: 7.8 })]);
    expect(outcome.action).toBe("increase-load");
    expect(outcome.prescription).toMatchObject({
      type: "strength",
      weightLb: 230,
    });
    expect(outcome.explanation).toContain("225 lb to 230 lb");
    expect(outcome.explanation).toContain("7.8");
  });

  it("increases when reps are completed and no RPE was logged", () => {
    const outcome = progressLinear(policy, base, [session(225, {})]);
    expect(outcome.action).toBe("increase-load");
    expect(outcome.prescription).toMatchObject({ weightLb: 230 });
  });

  it("repeats when reps are completed but RPE exceeds the cap", () => {
    const outcome = progressLinear(policy, base, [session(225, { rpe: 9 })]);
    expect(outcome.action).toBe("repeat");
    expect(outcome.prescription).toMatchObject({ weightLb: 225 });
  });

  it("repeats after a single missed session", () => {
    const outcome = progressLinear(policy, base, [session(225, { reps: 3 })]);
    expect(outcome.action).toBe("repeat");
    expect(outcome.prescription).toMatchObject({ weightLb: 225 });
  });

  it("deloads after consecutive missed sessions", () => {
    const outcome = progressLinear(policy, base, [
      session(225, { reps: 3 }),
      session(225, { reps: 4 }),
    ]);
    expect(outcome.action).toBe("deload");
    // 225 × 0.9 = 202.5 → nearest 5 lb = 205
    expect(outcome.prescription).toMatchObject({ weightLb: 205 });
    expect(outcome.explanation).toContain("Deload");
  });
});
