import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import type { ExerciseResult } from "@titan/domain/result";
import { completedWeight } from "./history";

const strengthResult = (
  prescribedWeight: number,
  setWeights: readonly (number | undefined)[],
): ExerciseResult => ({
  exerciseId: "back-squat",
  id: "r",
  prescription: Prescription.Strength({
    reps: 5,
    sets: setWeights.length,
    weight: prescribedWeight,
  }),
  sets: setWeights.map((weight, setIndex) => ({
    completed: true,
    reps: 5,
    setIndex,
    ...(weight === undefined ? {} : { weight }),
  })),
  slotId: "slot-squat",
});

describe("completedWeight", () => {
  it("falls back to the prescribed load when no set recorded a weight", () => {
    expect(completedWeight(strengthResult(225, [undefined, undefined]))).toBe(
      225,
    );
  });

  it("uses the load actually lifted when it exceeds the prescription", () => {
    expect(completedWeight(strengthResult(225, [235, 235, 235]))).toBe(235);
  });

  it("uses the lightest working set carried across the session", () => {
    expect(completedWeight(strengthResult(225, [235, 235, 205]))).toBe(205);
  });

  it("resolves an absent set weight from the prescription snapshot", () => {
    expect(completedWeight(strengthResult(225, [235, undefined]))).toBe(225);
  });

  it("throws when the snapshot is not a strength prescription", () => {
    const result: ExerciseResult = {
      exerciseId: "pull-up",
      id: "r",
      prescription: Prescription.Bodyweight({ reps: 8, sets: 3 }),
      sets: [{ completed: true, reps: 8, setIndex: 0 }],
      slotId: "slot-pull",
    };
    expect(() => completedWeight(result)).toThrow();
  });
});
