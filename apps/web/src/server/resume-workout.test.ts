import { describe, expect, it } from "bun:test";
import type { ExerciseResult, SetResult } from "@titan/domain/result";
import type {
  PrescribedExercise,
  WorkoutSession,
} from "@titan/domain/workout-session";
import { resumeWorkout } from "./resume-workout";

const prescribed = (slotId: string): PrescribedExercise =>
  ({ slotId }) as unknown as PrescribedExercise;

const result = (slotId: string): ExerciseResult =>
  ({ slotId }) as unknown as ExerciseResult;

const set = (setIndex: number): SetResult => ({
  completed: true,
  reps: 5,
  setIndex,
  weight: 100,
});

const session = (
  fields: Pick<
    WorkoutSession,
    "inProgress" | "prescribedExercises" | "results"
  >,
): WorkoutSession => fields as unknown as WorkoutSession;

describe("resumeWorkout", () => {
  it("starts at the first exercise when nothing has been logged", () => {
    expect(
      resumeWorkout(
        session({
          prescribedExercises: [prescribed("s1"), prescribed("s2")],
          results: [],
        }),
      ),
    ).toEqual({ index: 0, logged: [], results: [] });
  });

  it("picks up at the exercise after the last one recorded", () => {
    const recorded = result("s1");
    expect(
      resumeWorkout(
        session({
          prescribedExercises: [prescribed("s1"), prescribed("s2")],
          results: [recorded],
        }),
      ),
    ).toEqual({ index: 1, logged: [], results: [recorded] });
  });

  it("restores the sets logged so far for the exercise in progress", () => {
    const sets = [set(0), set(1)];
    expect(
      resumeWorkout(
        session({
          inProgress: { sets, slotId: "s2" },
          prescribedExercises: [prescribed("s1"), prescribed("s2")],
          results: [result("s1")],
        }),
      ).logged,
    ).toEqual(sets);
  });

  it("drops in-progress sets superseded by a recorded result", () => {
    expect(
      resumeWorkout(
        session({
          inProgress: { sets: [set(0)], slotId: "s1" },
          prescribedExercises: [prescribed("s1"), prescribed("s2")],
          results: [result("s1")],
        }),
      ).logged,
    ).toEqual([]);
  });
});
