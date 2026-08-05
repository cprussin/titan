import { describe, expect, it } from "bun:test";
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

const base = Prescription.TimedHold({ holdSec: 60, sets: 3 });

const holdResult = (
  holdSec: number,
  opts: { held?: number; addedWeightLb?: number } = {},
): ExerciseResult => ({
  exerciseId: "plank",
  id: `r-${holdSec}`,
  prescription: Prescription.TimedHold({
    ...(opts.addedWeightLb === undefined
      ? {}
      : { addedWeightLb: opts.addedWeightLb }),
    holdSec,
    sets: 3,
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

  it("adds weight once the duration ceiling is reached", () => {
    const outcome = progressTimedHold(policy, base, [holdResult(120)]);
    expect(outcome.action).toBe("increase-load");
    expect(outcome.prescription).toMatchObject({
      addedWeightLb: 5,
      holdSec: 120,
    });
  });

  it("repeats when the holds were not completed", () => {
    const outcome = progressTimedHold(policy, base, [
      holdResult(70, { held: 40 }),
    ]);
    expect(outcome.action).toBe("repeat");
    expect(outcome.prescription).toMatchObject({ holdSec: 70 });
  });
});
