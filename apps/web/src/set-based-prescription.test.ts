import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import { isSetBased } from "./set-based-prescription";

describe("isSetBased", () => {
  it("counts a timed carry among the set-by-set shapes", () => {
    expect(
      isSetBased(
        Prescription.TimedCarry({ durationSec: 40, sets: 3, weight: 150 }),
      ),
    ).toBe(true);
  });

  it("counts strength, bodyweight, and timed-hold work", () => {
    expect(
      isSetBased(Prescription.Strength({ reps: 5, sets: 5, weight: 225 })),
    ).toBe(true);
    expect(isSetBased(Prescription.Bodyweight({ reps: 8, sets: 3 }))).toBe(
      true,
    );
    expect(isSetBased(Prescription.TimedHold({ holdSec: 45, sets: 3 }))).toBe(
      true,
    );
  });

  it("leaves out a cardio piece recorded as one effort", () => {
    expect(
      isSetBased(Prescription.DistanceCardio({ distanceMeters: 5000 })),
    ).toBe(false);
  });
});
