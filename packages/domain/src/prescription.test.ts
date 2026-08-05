import { describe, expect, it } from "bun:test";
import { Prescription, prescriptionSchema } from "./prescription";

/** Strict type equality, used by the coverage harness below. */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Assert<T extends true> = T;

describe("Prescription constructors", () => {
  it("cover the schema union exactly (compile-time harness)", () => {
    const constructorsCoverUnion: Assert<
      Equals<
        ReturnType<(typeof Prescription)[keyof typeof Prescription]>,
        Prescription
      >
    > = true;
    expect(constructorsCoverUnion).toBe(true);
  });
});

describe("prescriptionSchema", () => {
  it("parses a strength prescription", () => {
    const value = Prescription.Strength({ reps: 5, sets: 5, weightLb: 225 });
    expect(prescriptionSchema.parse(value)).toEqual(value);
  });

  it("parses an intervals prescription with a work distance", () => {
    const value = Prescription.Intervals({
      count: 6,
      recoverySec: 120,
      targetSplitSecPer500: 105,
      workDistanceMeters: 500,
    });
    expect(prescriptionSchema.parse(value)).toEqual(value);
  });

  it("parses a circuit prescription", () => {
    const value = Prescription.Circuit({
      restSec: 90,
      rounds: 5,
      stations: [
        { distanceMeters: 250, exerciseId: "row" },
        { exerciseId: "burpee", reps: 10 },
      ],
    });
    expect(prescriptionSchema.parse(value)).toEqual(value);
  });

  it("rejects a strength prescription with zero sets", () => {
    expect(
      prescriptionSchema.safeParse({
        reps: 5,
        sets: 0,
        type: "strength",
        weightLb: 100,
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown prescription type", () => {
    expect(prescriptionSchema.safeParse({ type: "yoga" }).success).toBe(false);
  });
});
