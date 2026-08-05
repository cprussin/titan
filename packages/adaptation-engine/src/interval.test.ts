import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import type { ExerciseResult } from "@titan/domain/result";
import { progressInterval } from "./interval";

const policy = ProgressionPolicy.Interval({
  maxDegradationSecPer500: 2,
  paceImprovementSecPer500: 1,
  rpeCap: 8.5,
});

const base = Prescription.Intervals({
  count: 6,
  recoverySec: 120,
  targetSplitSecPer500: 105,
  workDistanceMeters: 500,
});

const intervalsResult = (splits: readonly number[]): ExerciseResult => ({
  exerciseId: "row-intervals",
  id: `r-${splits.join("-")}`,
  intervals: splits.map((split, index) => ({
    distanceMeters: 500,
    index,
    splitSecPer500: split,
  })),
  prescription: base,
  sets: [],
  slotId: "slot-intervals",
});

describe("progressInterval", () => {
  it("starts at the base with no history", () => {
    expect(progressInterval(policy, base, []).prescription).toEqual(base);
  });

  it("advances the split when all intervals complete within the drift cap", () => {
    const outcome = progressInterval(policy, base, [
      intervalsResult([105, 105, 106, 105, 106, 105]),
    ]);
    expect(outcome.action).toBe("advance-pace");
    expect(outcome.prescription).toMatchObject({ targetSplitSecPer500: 104 });
  });

  it("repeats when the drift exceeds the cap", () => {
    const outcome = progressInterval(policy, base, [
      intervalsResult([105, 106, 107, 108, 109, 110]),
    ]);
    expect(outcome.action).toBe("repeat");
    expect(outcome.prescription).toMatchObject({ targetSplitSecPer500: 105 });
  });

  it("repeats when intervals were not all completed", () => {
    const outcome = progressInterval(policy, base, [
      intervalsResult([105, 105, 105]),
    ]);
    expect(outcome.action).toBe("repeat");
  });
});
