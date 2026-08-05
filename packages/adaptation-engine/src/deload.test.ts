import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import { deloadPrescription } from "./deload";

describe("deloadPrescription", () => {
  it("cuts strength sets by ~40%", () => {
    const deloaded = deloadPrescription(
      Prescription.Strength({ reps: 5, sets: 5, weightLb: 225 }),
    );
    // 5 × 0.6 = 3, weight and reps preserved
    expect(deloaded).toMatchObject({ reps: 5, sets: 3, weightLb: 225 });
  });

  it("cuts interval count by ~30%", () => {
    const deloaded = deloadPrescription(
      Prescription.Intervals({
        count: 6,
        recoverySec: 120,
        workDistanceMeters: 500,
      }),
    );
    // 6 × 0.7 = 4.2 → 4
    expect(deloaded).toMatchObject({ count: 4 });
  });

  it("leaves Zone 2 cardio unchanged", () => {
    const zone2 = Prescription.TimedCardio({
      durationSec: 3600,
      targetHrZone: 2,
    });
    expect(deloadPrescription(zone2)).toEqual(zone2);
  });

  it("never drops below a single set", () => {
    const deloaded = deloadPrescription(
      Prescription.Strength({ reps: 5, sets: 1, weightLb: 100 }),
    );
    expect(deloaded).toMatchObject({ sets: 1 });
  });
});
