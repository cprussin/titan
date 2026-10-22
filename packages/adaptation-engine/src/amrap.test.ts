import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import type { ExerciseResult } from "@titan/domain/result";
import { progressAmrap } from "./amrap";

const policy = ProgressionPolicy.Amrap({ repCap: 15, sets: 3 });
const base = Prescription.Bodyweight({ reps: 10, sets: 3 });

const result = (reps: readonly number[], target = 10): ExerciseResult => ({
  exerciseId: "ab-wheel",
  id: `r-${reps.join("-")}`,
  prescription: Prescription.Bodyweight({
    reps: target,
    sets: reps.length,
  }),
  sets: reps.map((count, setIndex) => ({
    completed: true,
    reps: count,
    setIndex,
  })),
  slotId: "slot-ab-wheel",
});

describe("progressAmrap", () => {
  it("works toward the cap with no history", () => {
    const outcome = progressAmrap(policy, base, []);
    expect(outcome.action).toBe("maintain");
    expect(outcome.explanation).toContain("Work toward 3×15");
  });

  it("adds a rep over the weakest set once every set met its target", () => {
    const outcome = progressAmrap(policy, base, [result([13, 12, 12], 12)]);
    expect(outcome.action).toBe("increase-reps");
    expect(outcome.prescription).toEqual(
      Prescription.Bodyweight({ reps: 13, sets: 3 }),
    );
  });

  it("holds the last target when a set fell short of it", () => {
    const outcome = progressAmrap(policy, base, [result([12, 12, 9], 12)]);
    expect(outcome.action).toBe("repeat");
    expect(outcome.prescription).toEqual(
      Prescription.Bodyweight({ reps: 12, sets: 3 }),
    );
  });

  it("never prescribes below the base", () => {
    const outcome = progressAmrap(policy, base, [result([6, 6])]);
    expect(outcome.prescription).toEqual(base);
    expect(outcome.explanation).not.toContain("rep cap reached");
  });

  it("holds at the cap once every set hits it", () => {
    const outcome = progressAmrap(policy, base, [result([15, 15, 15], 14)]);
    expect(outcome.prescription).toEqual(
      Prescription.Bodyweight({ reps: 15, sets: 3 }),
    );
    expect(outcome.explanation).toContain("rep cap reached");
  });

  it("does not report the cap reached when only some sets hit it", () => {
    const outcome = progressAmrap(policy, base, [result([15, 15, 10])]);
    expect(outcome.explanation).not.toContain("rep cap reached");
  });
});
