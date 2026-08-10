import { describe, expect, it } from "bun:test";
import type { NormalizedWorkout } from "@titan/domain/external";
import { Prescription } from "@titan/domain/prescription";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import type { PrescribedExercise } from "@titan/domain/workout-session";
import { buildImportResult } from "./build-import-result";

const prescribed: PrescribedExercise = {
  exerciseId: "row",
  prescription: Prescription.DistanceCardio({ distanceMeters: 2000 }),
  progression: ProgressionPolicy.None(),
  role: "primary",
  slotId: "slot-row",
};

const normalized: NormalizedWorkout = {
  intervals: [],
  summary: {
    avgStrokeRate: 28,
    distanceMeters: 2000,
    durationSec: 450,
    splitSecPer500: 112.5,
  },
  workoutAt: "2024-01-15T08:30:00",
};

describe("buildImportResult", () => {
  it("logs the import summary as the exercise's cardio result", () => {
    const result = buildImportResult(prescribed, normalized);
    expect(result.cardio).toEqual(normalized.summary);
    expect(result.exerciseId).toBe("row");
    expect(result.slotId).toBe("slot-row");
    expect(result.prescription).toEqual(prescribed.prescription);
    expect(result.sets).toEqual([]);
  });

  it("carries the imported intervals through when present", () => {
    const withIntervals: NormalizedWorkout = {
      ...normalized,
      intervals: [{ distanceMeters: 500, durationSec: 110, index: 0 }],
    };
    expect(buildImportResult(prescribed, withIntervals).intervals).toEqual(
      withIntervals.intervals,
    );
  });

  it("omits intervals when the import has none", () => {
    expect(buildImportResult(prescribed, normalized).intervals).toBeUndefined();
  });
});
