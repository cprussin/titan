import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import type { ExerciseResult } from "@titan/domain/result";
import { progressAmrap } from "./amrap";

const policy = ProgressionPolicy.Amrap({ repCap: 15, sets: 3 });
const base = Prescription.Bodyweight({ reps: 10, sets: 3 });

const result = (reps: readonly number[]): ExerciseResult => ({
  exerciseId: "ab-wheel",
  id: `r-${reps.join("-")}`,
  prescription: Prescription.Bodyweight({
    reps: reps[0] ?? 0,
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

  it("keeps working toward the cap when sets finished below it", () => {
    const outcome = progressAmrap(policy, base, [result([10, 10, 10])]);
    expect(outcome.explanation).toContain("Work toward 3×15");
    expect(outcome.explanation).not.toContain("rep cap reached");
  });

  it("does not report the cap reached from a short, low session", () => {
    const outcome = progressAmrap(policy, base, [result([6, 6])]);
    expect(outcome.explanation).not.toContain("rep cap reached");
  });

  it("reports the cap reached only once every set hits it", () => {
    const outcome = progressAmrap(policy, base, [result([15, 15, 15])]);
    expect(outcome.explanation).toContain("rep cap reached");
  });

  it("still works toward the cap when only some sets hit it", () => {
    const outcome = progressAmrap(policy, base, [result([15, 15, 10])]);
    expect(outcome.explanation).not.toContain("rep cap reached");
  });
});
