import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import type { ExerciseResult } from "@titan/domain/result";
import type { WorkoutSession } from "@titan/domain/workout-session";
import { finishWorkoutSession } from "./finish-workout-session";

const result: ExerciseResult = {
  exerciseId: "back-squat",
  id: "a",
  prescription: Prescription.Strength({ reps: 5, sets: 1, weight: 100 }),
  sets: [{ completed: true, reps: 5, setIndex: 0, weight: 100 }],
  slotId: "squat",
};

// Recording the results — stamping them, and clearing the sets underway — is
// `recordWorkoutResults` and is tested there; what this module adds is closing
// the session at a given time.
const session = {
  id: "s1",
  results: [],
  status: "in-progress",
} as unknown as WorkoutSession;

const completedAt = "2026-08-11T19:00:00.000Z";

describe("finishWorkoutSession", () => {
  it("marks the session completed at the given time, with its results recorded", () => {
    expect(finishWorkoutSession(session, result, completedAt)).toMatchObject({
      completedAt,
      results: [{ ...result, recordedAt: completedAt }],
      status: "completed",
    });
  });
});
