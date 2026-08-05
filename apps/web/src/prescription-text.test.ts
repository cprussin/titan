import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import { describePrescription } from "./prescription-text";

describe("describePrescription", () => {
  it("describes a strength target", () => {
    expect(
      describePrescription(
        Prescription.Strength({ reps: 5, sets: 5, weightLb: 230 }),
      ),
    ).toBe("5×5 @ 230 lb");
  });

  it("describes weighted bodyweight", () => {
    expect(
      describePrescription(
        Prescription.Bodyweight({ addedWeightLb: 25, reps: 6, sets: 4 }),
      ),
    ).toBe("4×6 +25 lb");
  });

  it("describes an interval target", () => {
    expect(
      describePrescription(
        Prescription.Intervals({
          count: 6,
          recoverySec: 120,
          targetSplitSecPer500: 105,
          workDistanceMeters: 500,
        }),
      ),
    ).toBe("6 × 500 m @ 1:45.0 /500m · 2:00 recovery");
  });
});
