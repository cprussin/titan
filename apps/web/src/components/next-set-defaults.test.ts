import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import type { SetResult } from "@titan/domain/result";

import {
  nextSetReps,
  nextSetSeconds,
  nextSetWeight,
} from "./next-set-defaults";

const strength = Prescription.Strength({ reps: 5, sets: 3, weight: 100 });

const set = (fields: Partial<SetResult>): SetResult => ({
  completed: true,
  setIndex: 0,
  ...fields,
});

describe("nextSetWeight", () => {
  it("uses the prescribed weight for the first set", () => {
    expect(nextSetWeight(strength, [])).toBe(100);
  });

  it("uses the prescribed load for a timed carry's first set", () => {
    expect(
      nextSetWeight(
        Prescription.TimedCarry({ durationSec: 40, sets: 3, weight: 150 }),
        [],
      ),
    ).toBe(150);
  });

  it("carries the last logged set's weight forward on later sets", () => {
    expect(nextSetWeight(strength, [set({ reps: 5, weight: 115 })])).toBe(115);
  });

  it("carries the most recent set's weight when several are logged", () => {
    expect(
      nextSetWeight(strength, [
        set({ reps: 5, setIndex: 0, weight: 115 }),
        set({ reps: 5, setIndex: 1, weight: 120 }),
      ]),
    ).toBe(120);
  });
});

describe("nextSetSeconds", () => {
  it("uses the prescribed duration for a timed carry", () => {
    expect(
      nextSetSeconds(
        Prescription.TimedCarry({ durationSec: 40, sets: 3, weight: 150 }),
      ),
    ).toBe(40);
  });

  it("uses the prescribed hold for a timed hold", () => {
    expect(
      nextSetSeconds(Prescription.TimedHold({ holdSec: 45, sets: 3 })),
    ).toBe(45);
  });

  it("has no seconds to prefill for rep-based work", () => {
    expect(nextSetSeconds(strength)).toBe(0);
  });
});

describe("nextSetReps", () => {
  it("uses the prescribed reps for a strength prescription", () => {
    expect(nextSetReps(strength)).toBe(5);
  });

  it("uses the prescribed reps for a bodyweight prescription", () => {
    expect(nextSetReps(Prescription.Bodyweight({ reps: 8, sets: 3 }))).toBe(8);
  });
});
