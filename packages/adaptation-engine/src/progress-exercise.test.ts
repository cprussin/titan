import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import { progressExercise } from "./progress-exercise";

describe("progressExercise", () => {
  it("maintains the base for a none policy", () => {
    const base = Prescription.DistanceCardio({ distanceMeters: 20_000 });
    const outcome = progressExercise(ProgressionPolicy.None(), base, []);
    expect(outcome.action).toBe("maintain");
    expect(outcome.prescription).toEqual(base);
  });

  it("routes a linear policy to load progression", () => {
    const base = Prescription.Strength({ reps: 5, sets: 5, weightLb: 135 });
    const outcome = progressExercise(
      ProgressionPolicy.Linear({
        incrementLb: 5,
        missesBeforeDeload: 2,
        reps: 5,
        retainOnDeload: 0.9,
        rpeCap: 8.5,
        sets: 5,
      }),
      base,
      [
        {
          exerciseId: "bench",
          id: "r1",
          prescription: Prescription.Strength({
            reps: 5,
            sets: 5,
            weightLb: 135,
          }),
          sets: Array.from({ length: 5 }, (_, setIndex) => ({
            completed: true,
            reps: 5,
            setIndex,
          })),
          slotId: "slot-bench",
        },
      ],
    );
    expect(outcome.action).toBe("increase-load");
    expect(outcome.prescription).toMatchObject({ weightLb: 140 });
  });
});
