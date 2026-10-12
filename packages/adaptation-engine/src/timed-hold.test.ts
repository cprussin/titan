import { describe, expect, it } from "bun:test";
import type { LoadUnit } from "@titan/domain/load-unit";
import { Prescription } from "@titan/domain/prescription";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import type { ExerciseResult } from "@titan/domain/result";
import { progressTimedHold } from "./timed-hold";

const policy = ProgressionPolicy.TimedHold({
  addWeightAfterSec: 120,
  holdIncrementSec: 10,
  sets: 3,
  startSec: 60,
});

const base = Prescription.TimedHold({ holdSec: 60, sets: 3, unit: "kg" });

const holdResult = (
  holdSec: number,
  opts: { held?: number; addedWeight?: number; unit?: LoadUnit } = {},
): ExerciseResult => ({
  exerciseId: "plank",
  id: `r-${holdSec}`,
  prescription: Prescription.TimedHold({
    ...(opts.addedWeight === undefined
      ? {}
      : { addedWeight: opts.addedWeight }),
    holdSec,
    sets: 3,
    unit: opts.unit ?? "kg",
  }),
  sets: Array.from({ length: 3 }, (_, setIndex) => ({
    completed: true,
    holdSec: opts.held ?? holdSec,
    setIndex,
  })),
  slotId: "slot-plank",
});

describe("progressTimedHold", () => {
  it("starts at the base with no history", () => {
    expect(progressTimedHold(policy, base, []).prescription).toEqual(base);
  });

  it("extends the hold below the weight threshold", () => {
    const outcome = progressTimedHold(policy, base, [holdResult(60)]);
    expect(outcome.action).toBe("increase-duration");
    expect(outcome.prescription).toMatchObject({ holdSec: 70 });
  });

  it("adds weight in kilograms once the duration ceiling is reached", () => {
    const outcome = progressTimedHold(policy, base, [
      holdResult(120, { addedWeight: 5 }),
    ]);
    expect(outcome.action).toBe("increase-load");
    expect(outcome.prescription).toEqual(
      Prescription.TimedHold({
        addedWeight: 7.5,
        holdSec: 120,
        sets: 3,
        unit: "kg",
      }),
    );
  });

  it("converts a legacy pound load to the base's kilograms", () => {
    // 10 lb ≈ 4.54 kg → 5 kg on the plate grid, then +2.5 kg.
    const outcome = progressTimedHold(policy, base, [
      holdResult(120, { addedWeight: 10, unit: "lb" }),
    ]);
    expect(outcome.prescription).toMatchObject({
      addedWeight: 7.5,
      unit: "kg",
    });
  });

  it("converts a kilogram load to a pound base", () => {
    // 5 kg ≈ 11.02 lb → 10 lb on the plate grid, then +5 lb.
    const outcome = progressTimedHold(
      policy,
      Prescription.TimedHold({ holdSec: 60, sets: 3 }),
      [holdResult(120, { addedWeight: 5 })],
    );
    expect(outcome.prescription).toMatchObject({ addedWeight: 15, unit: "lb" });
  });

  it("repeats when the holds were not completed", () => {
    const outcome = progressTimedHold(policy, base, [
      holdResult(70, { held: 40 }),
    ]);
    expect(outcome.action).toBe("repeat");
    expect(outcome.prescription).toMatchObject({ holdSec: 70 });
  });
});
