import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import type { ExerciseResult } from "@titan/domain/result";
import { progressZone2 } from "./zone2";

const policy = ProgressionPolicy.Zone2({
  durationIncrementSec: 300,
  maxDurationSec: 3600,
  startDurationSec: 2700,
});

const base = Prescription.TimedCardio({
  durationSec: 2700,
  strokeRateMax: 22,
  strokeRateMin: 18,
  targetHrZone: 2,
});

const rowResult = (durationSec: number): ExerciseResult => ({
  exerciseId: "row-zone2",
  id: `r-${durationSec}`,
  prescription: Prescription.TimedCardio({ durationSec, targetHrZone: 2 }),
  sets: [],
  slotId: "slot-row",
});

describe("progressZone2", () => {
  it("starts at the base with no history", () => {
    expect(progressZone2(policy, base, []).prescription).toEqual(base);
  });

  it("extends duration toward the cap, keeping intensity", () => {
    const outcome = progressZone2(policy, base, [rowResult(2700)]);
    expect(outcome.action).toBe("increase-duration");
    expect(outcome.prescription).toMatchObject({
      durationSec: 3000,
      targetHrZone: 2,
    });
  });

  it("holds at the duration cap", () => {
    const outcome = progressZone2(policy, base, [rowResult(3600)]);
    expect(outcome.action).toBe("maintain");
    expect(outcome.prescription).toMatchObject({ durationSec: 3600 });
  });
});
