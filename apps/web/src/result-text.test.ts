import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import type { ExerciseResult, SetResult } from "@titan/domain/result";
import { loggedExerciseLines } from "./result-text";

const result = (
  over: Partial<ExerciseResult> & Pick<ExerciseResult, "prescription">,
): ExerciseResult => ({
  exerciseId: "back-squat",
  id: "result-1",
  sets: [],
  slotId: "slot-1",
  ...over,
});

const set = (over: Partial<SetResult>): SetResult => ({
  completed: true,
  setIndex: 0,
  ...over,
});

describe("loggedExerciseLines", () => {
  it("labels each strength set with its reps and load", () => {
    expect(
      loggedExerciseLines(
        result({
          prescription: Prescription.Strength({
            reps: 5,
            sets: 2,
            weight: 225,
          }),
          sets: [
            set({ reps: 5, setIndex: 0, weight: 225 }),
            set({ reps: 5, setIndex: 1, weight: 230 }),
          ],
        }),
      ),
    ).toEqual([
      { label: "Set 1", value: "5 × 225 lb" },
      { label: "Set 2", value: "5 × 230 lb" },
    ]);
  });

  it("logs a barbell set's load in its kilogram unit", () => {
    expect(
      loggedExerciseLines(
        result({
          prescription: Prescription.Strength({
            reps: 3,
            sets: 1,
            unit: "kg",
            weight: 100,
          }),
          sets: [set({ reps: 3, weight: 100 })],
        }),
      ),
    ).toEqual([{ label: "Set 1", value: "3 × 100 kg" }]);
  });

  it("logs a bodyweight set as reps only, ignoring the placeholder load", () => {
    expect(
      loggedExerciseLines(
        result({
          prescription: Prescription.Bodyweight({ reps: 12, sets: 1 }),
          sets: [set({ reps: 12, weight: 0 })],
        }),
      ),
    ).toEqual([{ label: "Set 1", value: "12 reps" }]);
  });

  it("logs a timed hold in seconds", () => {
    expect(
      loggedExerciseLines(
        result({
          prescription: Prescription.TimedHold({ holdSec: 45, sets: 1 }),
          sets: [set({ holdSec: 50 })],
        }),
      ),
    ).toEqual([{ label: "Set 1", value: "50s hold" }]);
  });

  it("summarizes a cardio effort as a single line of its optics", () => {
    expect(
      loggedExerciseLines(
        result({
          cardio: {
            avgHr: 150,
            distanceMeters: 5000,
            durationSec: 1200,
            splitSecPer500: 120,
          },
          prescription: Prescription.DistanceCardio({ distanceMeters: 5000 }),
        }),
      ),
    ).toEqual([
      { label: "", value: "5,000 m · 20:00 · 2:00.0 /500m · 150 bpm" },
    ]);
  });

  it("marks a cardio effort with no recorded optics rather than blanking", () => {
    expect(
      loggedExerciseLines(
        result({
          cardio: {},
          prescription: Prescription.DistanceCardio({ distanceMeters: 2000 }),
        }),
      ),
    ).toEqual([{ label: "", value: "—" }]);
  });

  it("throws when a cardio result is missing its effort summary", () => {
    expect(() =>
      loggedExerciseLines(
        result({
          prescription: Prescription.DistanceCardio({ distanceMeters: 2000 }),
        }),
      ),
    ).toThrow("effort summary");
  });

  it("throws when a strength set is missing its load", () => {
    expect(() =>
      loggedExerciseLines(
        result({
          prescription: Prescription.Strength({
            reps: 5,
            sets: 1,
            weight: 225,
          }),
          sets: [set({ reps: 5 })],
        }),
      ),
    ).toThrow("weight");
  });
});
