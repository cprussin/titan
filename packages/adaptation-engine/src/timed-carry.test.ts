import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import type { ExerciseResult } from "@titan/domain/result";
import { progressTimedCarry } from "./timed-carry";

const policy = ProgressionPolicy.TimedCarry({
  durationSec: 40,
  increment: 5,
  rpeCap: 8,
  sets: 3,
});

const base = Prescription.TimedCarry({ durationSec: 40, sets: 3, weight: 150 });

const carryResult = (
  weight: number,
  opts: { carried?: number; rpe?: number } = {},
): ExerciseResult => ({
  exerciseId: "farmer-carry",
  id: `r-${weight}`,
  prescription: Prescription.TimedCarry({ durationSec: 40, sets: 3, weight }),
  sets: Array.from({ length: 3 }, (_, setIndex) => ({
    completed: true,
    durationSec: opts.carried ?? 40,
    setIndex,
    weight,
    ...(opts.rpe === undefined ? {} : { rpe: opts.rpe }),
  })),
  slotId: "slot-carry",
});

describe("progressTimedCarry", () => {
  it("starts at the base with no history", () => {
    expect(progressTimedCarry(policy, base, []).prescription).toEqual(base);
  });

  it("adds load when every carry held the full duration under the RPE cap", () => {
    const outcome = progressTimedCarry(policy, base, [
      carryResult(150, { rpe: 7 }),
    ]);
    expect(outcome.action).toBe("increase-load");
    expect(outcome.prescription).toEqual(
      Prescription.TimedCarry({ durationSec: 40, sets: 3, weight: 155 }),
    );
  });

  it("keeps the duration fixed rather than extending it", () => {
    expect(
      progressTimedCarry(policy, base, [carryResult(150, { rpe: 7 })])
        .prescription,
    ).toMatchObject({ durationSec: 40 });
  });

  it("repeats the load when a carry was cut short", () => {
    const outcome = progressTimedCarry(policy, base, [
      carryResult(150, { carried: 25, rpe: 7 }),
    ]);
    expect(outcome.action).toBe("repeat");
    expect(outcome.prescription).toMatchObject({ weight: 150 });
  });

  it("repeats the load when the carries ran over the RPE cap", () => {
    const outcome = progressTimedCarry(policy, base, [
      carryResult(150, { rpe: 9 }),
    ]);
    expect(outcome.action).toBe("repeat");
    expect(outcome.prescription).toMatchObject({ weight: 150 });
  });

  it("builds on the load actually carried, not the one prescribed", () => {
    const outcome = progressTimedCarry(policy, base, [
      carryResult(160, { rpe: 7 }),
    ]);
    expect(outcome.prescription).toMatchObject({ weight: 165 });
  });

  it("carries the prescribed unit forward", () => {
    const metric = Prescription.TimedCarry({
      durationSec: 40,
      sets: 3,
      unit: "kg",
      weight: 32,
    });
    expect(progressTimedCarry(policy, metric, []).prescription).toMatchObject({
      unit: "kg",
    });
  });

  it("holds the base when the only history is rep-based, pre-timing logs", () => {
    // Farmer carries logged before the movement was prescribed by time carry a
    // strength snapshot. They stay readable, but there is no carry duration in
    // them to judge, so the first timed session starts from the base.
    const outcome = progressTimedCarry(policy, base, [
      {
        exerciseId: "farmer-carry",
        id: "r-legacy",
        prescription: Prescription.Strength({ reps: 1, sets: 4, weight: 150 }),
        sets: [{ completed: true, reps: 1, rpe: 7, setIndex: 0, weight: 150 }],
        slotId: "slot-carry",
      },
    ]);
    expect(outcome.action).toBe("maintain");
    expect(outcome.prescription).toEqual(base);
  });

  it("throws when the base is not a timed carry", () => {
    expect(() =>
      progressTimedCarry(
        policy,
        Prescription.Strength({ reps: 5, sets: 3, weight: 150 }),
        [],
      ),
    ).toThrow();
  });
});
