import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import type { ExerciseResult } from "@titan/domain/result";
import type {
  InProgressExercise,
  WorkoutSession,
} from "@titan/domain/workout-session";
import { recordWorkoutResults } from "./record-workout-results";

const result = (id: string, slotId: string): ExerciseResult => ({
  exerciseId: "back-squat",
  id,
  prescription: Prescription.Strength({ reps: 5, sets: 1, weight: 100 }),
  sets: [{ completed: true, reps: 5, setIndex: 0, weight: 100 }],
  slotId,
});

const stored = {
  ...result("a", "squat"),
  recordedAt: "2026-08-11T18:00:00.000Z",
};

const inProgress: InProgressExercise = {
  sets: [{ completed: true, reps: 5, rpe: 8, setIndex: 0, weight: 100 }],
  slotId: "bench",
};

const session = (
  fields: Partial<Pick<WorkoutSession, "inProgress" | "results">>,
): WorkoutSession =>
  ({
    id: "s1",
    results: [],
    status: "in-progress",
    ...fields,
  }) as unknown as WorkoutSession;

const now = "2026-08-11T18:05:00.000Z";

describe("recordWorkoutResults", () => {
  it("adds the exercise to the log, stamped with the time it was recorded", () => {
    expect(
      recordWorkoutResults(
        session({ results: [stored] }),
        result("b", "bench"),
        now,
      ).results,
    ).toEqual([stored, { ...result("b", "bench"), recordedAt: now }]);
  });

  // The replacement keeps its slot's position *and* the time that slot was first
  // recorded: results are read pairwise as a timeline (see `session-duration.ts`),
  // so a slot re-recorded later must not jump ahead of the pieces that followed it.
  it("replaces the slot's earlier result in place rather than logging it twice", () => {
    const bench = {
      ...result("b", "bench"),
      recordedAt: "2026-08-11T18:02:00.000Z",
    };
    expect(
      recordWorkoutResults(
        session({ results: [stored, bench] }),
        result("c", "squat"),
        now,
      ).results,
    ).toEqual([
      { ...result("c", "squat"), recordedAt: stored.recordedAt },
      bench,
    ]);
  });

  it("clears the sets underway, which the recorded exercise now accounts for", () => {
    expect(
      recordWorkoutResults(session({ inProgress }), result("b", "bench"), now)
        .inProgress,
    ).toBeUndefined();
  });
});
