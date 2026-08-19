import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import type { ExerciseResult, SetResult } from "@titan/domain/result";
import type { PrescribedExercise } from "@titan/domain/workout-session";
import { sessionOverview } from "./session-overview";

const squat = Prescription.Strength({ reps: 5, sets: 2, weight: 225 });
const row = Prescription.DistanceCardio({ distanceMeters: 2000 });

const prescribed = (
  slotId: string,
  exerciseId: string,
  prescription: PrescribedExercise["prescription"],
): PrescribedExercise => ({
  exerciseId,
  prescription,
  progression: ProgressionPolicy.None(),
  role: "primary",
  slotId,
});

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

describe("sessionOverview", () => {
  it("names each exercise and its target, marking where the session stands", () => {
    expect(
      sessionOverview({
        currentIndex: 1,
        exerciseNames: { "back-squat": "Back Squat" },
        logged: [],
        prescribedExercises: [
          prescribed("slot-1", "back-squat", squat),
          prescribed("slot-2", "bench-press", squat),
          prescribed("slot-3", "row", row),
        ],
        results: [result({ prescription: squat })],
      }),
    ).toMatchObject([
      {
        name: "Back Squat",
        slotId: "slot-1",
        state: "done",
        target: "2×5 @ 225 lb",
      },
      { name: "bench-press", slotId: "slot-2", state: "current" },
      { name: "row", slotId: "slot-3", state: "upcoming", target: "2,000 m" },
    ]);
  });

  it("lists every set logged against a finished exercise with its rating", () => {
    const [first] = sessionOverview({
      currentIndex: 1,
      exerciseNames: {},
      logged: [],
      prescribedExercises: [
        prescribed("slot-1", "back-squat", squat),
        prescribed("slot-2", "bench-press", squat),
      ],
      results: [
        result({
          prescription: squat,
          sets: [
            set({ reps: 5, rpe: 7, setIndex: 0, weight: 225 }),
            set({ reps: 4, rpe: 9, setIndex: 1, weight: 225 }),
          ],
        }),
      ],
    });
    expect(first?.sets).toEqual([
      { label: "Set 1", rpe: 7, value: "5 × 225 lb" },
      { label: "Set 2", rpe: 9, value: "4 × 225 lb" },
    ]);
  });

  it("lists the sets logged so far against the exercise in progress", () => {
    const [current] = sessionOverview({
      currentIndex: 0,
      exerciseNames: {},
      logged: [set({ reps: 5, rpe: 8, setIndex: 0, weight: 225 })],
      prescribedExercises: [prescribed("slot-1", "back-squat", squat)],
      results: [],
    });
    expect(current?.sets).toEqual([
      { label: "Set 1", rpe: 8, value: "5 × 225 lb" },
    ]);
  });

  it("summarizes a finished cardio piece as its single effort", () => {
    const [first] = sessionOverview({
      currentIndex: 1,
      exerciseNames: {},
      logged: [],
      prescribedExercises: [
        prescribed("slot-1", "row", row),
        prescribed("slot-2", "bench-press", squat),
      ],
      results: [
        result({
          cardio: { distanceMeters: 2000, durationSec: 600 },
          prescription: row,
        }),
      ],
    });
    expect(first?.sets).toEqual([
      { label: "", rpe: undefined, value: "2,000 m · 10:00" },
    ]);
  });

  it("leaves upcoming exercises without logged work", () => {
    const [, upcoming] = sessionOverview({
      currentIndex: 0,
      exerciseNames: {},
      logged: [],
      prescribedExercises: [
        prescribed("slot-1", "back-squat", squat),
        prescribed("slot-2", "bench-press", squat),
      ],
      results: [],
    });
    expect(upcoming?.sets).toEqual([]);
  });

  it("leaves a cardio piece in progress without logged work", () => {
    const [current] = sessionOverview({
      currentIndex: 0,
      exerciseNames: {},
      logged: [],
      prescribedExercises: [prescribed("slot-1", "row", row)],
      results: [],
    });
    expect(current?.sets).toEqual([]);
  });

  it("rejects a finished exercise that recorded no result", () => {
    expect(() =>
      sessionOverview({
        currentIndex: 1,
        exerciseNames: {},
        logged: [],
        prescribedExercises: [
          prescribed("slot-1", "back-squat", squat),
          prescribed("slot-2", "bench-press", squat),
        ],
        results: [],
      }),
    ).toThrow("slot-1");
  });
});
