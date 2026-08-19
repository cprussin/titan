import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import type { ExerciseResult, SetResult } from "@titan/domain/result";

import { describePreviousPerformance } from "./previous-performance";

const set = (fields: Partial<SetResult>): SetResult => ({
  completed: true,
  setIndex: 0,
  ...fields,
});

const result = (
  prescription: ExerciseResult["prescription"],
  sets: readonly SetResult[],
): ExerciseResult => ({
  exerciseId: "e1",
  id: "r1",
  prescription,
  sets: [...sets],
  slotId: "s1",
});

describe("describePreviousPerformance", () => {
  describe("strength", () => {
    const strength = Prescription.Strength({ reps: 5, sets: 3, weight: 100 });

    it("shows the heaviest working set as reps × load", () => {
      expect(
        describePreviousPerformance(
          result(strength, [
            set({ reps: 5, setIndex: 0, weight: 100 }),
            set({ reps: 3, setIndex: 1, weight: 115 }),
            set({ reps: 2, setIndex: 2, weight: 110 }),
          ]),
        ),
      ).toBe("3 × 115 lb");
    });

    it("breaks a tie on load by the higher rep count", () => {
      expect(
        describePreviousPerformance(
          result(strength, [
            set({ reps: 4, setIndex: 0, weight: 115 }),
            set({ reps: 6, setIndex: 1, weight: 115 }),
          ]),
        ),
      ).toBe("6 × 115 lb");
    });

    it("carries the barbell unit through from the prescription", () => {
      const barbell = Prescription.Strength({
        reps: 5,
        sets: 3,
        unit: "kg",
        weight: 60,
      });
      expect(
        describePreviousPerformance(
          result(barbell, [set({ reps: 5, weight: 62.5 })]),
        ),
      ).toBe("5 × 62.5 kg");
    });

    it("shows nothing when no set recorded a load", () => {
      expect(
        describePreviousPerformance(result(strength, [set({ reps: 5 })])),
      ).toBeUndefined();
    });

    it("passes over a set missing a figure rather than borrowing the prescription", () => {
      expect(
        describePreviousPerformance(
          result(strength, [
            set({ reps: 5, setIndex: 0, weight: 100 }),
            set({ setIndex: 1, weight: 115 }),
          ]),
        ),
      ).toBe("5 × 100 lb");
    });
  });

  describe("bodyweight", () => {
    it("shows reps only, never a phantom set weight", () => {
      // Regression: a bodyweight set can carry a stray `weight` (0, or a value
      // dragged in from an earlier movement). The last-time hint must report
      // reps for a bodyweight movement and never surface that number as a load.
      const pullup = Prescription.Bodyweight({ reps: 8, sets: 3 });
      expect(
        describePreviousPerformance(
          result(pullup, [
            set({ reps: 8, setIndex: 0, weight: 60 }),
            set({ reps: 8, setIndex: 1, weight: 60 }),
          ]),
        ),
      ).toBe("8 reps");
    });

    it("uses the best (highest-rep) set", () => {
      const pullup = Prescription.Bodyweight({ reps: 8, sets: 3 });
      expect(
        describePreviousPerformance(
          result(pullup, [
            set({ reps: 6, setIndex: 0 }),
            set({ reps: 9, setIndex: 1 }),
            set({ reps: 7, setIndex: 2 }),
          ]),
        ),
      ).toBe("9 reps");
    });

    it("appends the added load from the prescription for a weighted movement", () => {
      const weighted = Prescription.Bodyweight({
        addedWeightLb: 25,
        reps: 6,
        sets: 4,
      });
      expect(
        describePreviousPerformance(result(weighted, [set({ reps: 6 })])),
      ).toBe("6 reps +25 lb");
    });
  });

  describe("timed hold", () => {
    it("shows the longest hold", () => {
      const plank = Prescription.TimedHold({ holdSec: 45, sets: 3 });
      expect(
        describePreviousPerformance(
          result(plank, [
            set({ holdSec: 40, setIndex: 0 }),
            set({ holdSec: 52, setIndex: 1 }),
          ]),
        ),
      ).toBe("52s");
    });

    it("appends the added load for a weighted hold", () => {
      const weighted = Prescription.TimedHold({
        addedWeightLb: 10,
        holdSec: 45,
        sets: 3,
      });
      expect(
        describePreviousPerformance(result(weighted, [set({ holdSec: 45 })])),
      ).toBe("45s +10 lb");
    });
  });

  describe("nothing to show", () => {
    it("returns undefined when no sets were logged", () => {
      const strength = Prescription.Strength({ reps: 5, sets: 3, weight: 100 });
      expect(describePreviousPerformance(result(strength, []))).toBeUndefined();
    });

    it("returns undefined for a cardio result with no per-set history", () => {
      const cardio = Prescription.DistanceCardio({ distanceMeters: 2000 });
      expect(describePreviousPerformance(result(cardio, []))).toBeUndefined();
    });
  });
});
