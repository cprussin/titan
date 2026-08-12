import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import { prescriptionColumns } from "./prescription-columns";

describe("prescriptionColumns", () => {
  it("splits a strength prescription into scheme and load", () => {
    const columns = prescriptionColumns(
      Prescription.Strength({ reps: 5, sets: 5, weight: 225 }),
    );
    expect(columns.scheme).toBe("5×5");
    expect(columns.load).toBe("225 lb");
  });

  it("shows a weighted bodyweight movement's added load", () => {
    const columns = prescriptionColumns(
      Prescription.Bodyweight({ addedWeightLb: 25, reps: 10, sets: 3 }),
    );
    expect(columns.scheme).toBe("3×10");
    expect(columns.load).toBe("+25 lb");
  });

  it("labels an unweighted bodyweight movement as bodyweight", () => {
    const columns = prescriptionColumns(
      Prescription.Bodyweight({ reps: 12, sets: 3 }),
    );
    expect(columns.scheme).toBe("3×12");
    expect(columns.load).toBe("Bodyweight");
  });

  it("puts the set count in the scheme and the hold in the load for a timed hold", () => {
    const columns = prescriptionColumns(
      Prescription.TimedHold({ holdSec: 45, sets: 3 }),
    );
    expect(columns.scheme).toBe("3×");
    expect(columns.load).toBe("45s hold");
  });

  it("carries a timed hold's added load onto its hold", () => {
    const columns = prescriptionColumns(
      Prescription.TimedHold({ addedWeightLb: 20, holdSec: 45, sets: 3 }),
    );
    expect(columns.load).toBe("45s hold +20 lb");
  });

  it("splits a distance-cardio piece into distance and split", () => {
    const columns = prescriptionColumns(
      Prescription.DistanceCardio({
        distanceMeters: 5000,
        targetSplitSecPer500: 112,
      }),
    );
    expect(columns.scheme).toBe("5,000 m");
    expect(columns.load).toBe("1:52.0 /500m");
  });

  it("leaves the load blank when a distance piece has no target split", () => {
    const columns = prescriptionColumns(
      Prescription.DistanceCardio({ distanceMeters: 2000 }),
    );
    expect(columns.scheme).toBe("2,000 m");
    expect(columns.load).toBeUndefined();
  });

  it("splits intervals into count-by-work and split", () => {
    const columns = prescriptionColumns(
      Prescription.Intervals({
        count: 8,
        recoverySec: 90,
        targetSplitSecPer500: 108,
        workDistanceMeters: 500,
      }),
    );
    expect(columns.scheme).toBe("8 × 500 m");
    expect(columns.load).toBe("1:48.0 /500m");
  });

  it("puts a timed-cardio duration in the scheme with its zone as the load", () => {
    const columns = prescriptionColumns(
      Prescription.TimedCardio({ durationSec: 2400, targetHrZone: 2 }),
    );
    expect(columns.scheme).toBe("40 min");
    expect(columns.load).toBe("Zone 2");
  });
});
