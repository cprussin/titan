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

  it("routes a timed-carry policy to load progression without rep targets", () => {
    const base = Prescription.TimedCarry({
      durationSec: 40,
      sets: 3,
      weight: 150,
    });
    const outcome = progressExercise(
      ProgressionPolicy.TimedCarry({
        durationSec: 40,
        increment: 5,
        rpeCap: 8,
        sets: 3,
      }),
      base,
      [
        {
          exerciseId: "farmer-carry",
          id: "r1",
          prescription: base,
          sets: Array.from({ length: 3 }, (_, setIndex) => ({
            completed: true,
            durationSec: 40,
            rpe: 7,
            setIndex,
          })),
          slotId: "slot-carry",
        },
      ],
    );
    expect(outcome.action).toBe("increase-load");
    expect(outcome.prescription).toEqual(
      Prescription.TimedCarry({ durationSec: 40, sets: 3, weight: 155 }),
    );
  });

  it("routes a linear policy to load progression", () => {
    const base = Prescription.Strength({ reps: 5, sets: 5, weight: 135 });
    const outcome = progressExercise(
      ProgressionPolicy.Linear({
        increment: 5,
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
            weight: 135,
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
    expect(outcome.prescription).toMatchObject({ weight: 140 });
  });
});
