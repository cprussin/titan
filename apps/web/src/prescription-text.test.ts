import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import { describePrescription } from "./prescription-text";

describe("describePrescription", () => {
  it("describes a strength target", () => {
    expect(
      describePrescription(
        Prescription.Strength({ reps: 5, sets: 5, weight: 230 }),
      ),
    ).toBe("5×5 @ 230 lb");
  });

  it("describes a metric (barbell) strength target in kilograms", () => {
    expect(
      describePrescription(
        Prescription.Strength({ reps: 5, sets: 5, unit: "kg", weight: 100 }),
      ),
    ).toBe("5×5 @ 100 kg");
  });

  it("describes a timed carry by duration, never reps", () => {
    expect(
      describePrescription(
        Prescription.TimedCarry({ durationSec: 40, sets: 3, weight: 150 }),
      ),
    ).toBe("3 × 40s @ 150 lb");
  });

  it("describes band work by its sets and reps alone", () => {
    expect(describePrescription(Prescription.Band({ reps: 10, sets: 3 }))).toBe(
      "3×10",
    );
  });

  it("describes weighted bodyweight", () => {
    expect(
      describePrescription(
        Prescription.Bodyweight({ addedWeight: 25, reps: 6, sets: 4 }),
      ),
    ).toBe("4×6 +25 lb");
  });

  it("describes a belt-loaded bodyweight target in kilograms", () => {
    expect(
      describePrescription(
        Prescription.Bodyweight({
          addedWeight: 10,
          reps: 6,
          sets: 4,
          unit: "kg",
        }),
      ),
    ).toBe("4×6 +10 kg");
  });

  it("describes timed-effort work by its bouts, with the rest alongside", () => {
    expect(
      describePrescription(
        Prescription.TimedEffort({ restSec: 75, sets: 6, workSec: 45 }),
      ),
    ).toBe("6 × 45s · 1:15 rest");
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
