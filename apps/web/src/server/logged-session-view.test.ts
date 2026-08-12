import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import type { ExerciseResult } from "@titan/domain/result";
import type { WorkoutSession } from "@titan/domain/workout-session";
import { loggedSessionView } from "./logged-session-view";

const set = (reps: number, rpe?: number) => ({ completed: true, reps, rpe });

const strengthResult = (): ExerciseResult =>
  ({
    exerciseId: "squat-ex",
    prescription: Prescription.Strength({ reps: 5, sets: 5, weight: 225 }),
    role: "primary",
    sets: [set(5, 7.8), set(5, 7.8), set(5), set(5), set(5)],
    slotId: "squat-slot",
  }) as unknown as ExerciseResult;

const partialBodyweight = (): ExerciseResult =>
  ({
    exerciseId: "split-ex",
    prescription: Prescription.Bodyweight({
      addedWeightLb: 25,
      reps: 10,
      sets: 3,
    }),
    role: "accessory",
    sets: [set(10, 8), set(10), set(8, 9)],
    slotId: "split-slot",
  }) as unknown as ExerciseResult;

const holdResult = (): ExerciseResult =>
  ({
    exerciseId: "plank-ex",
    prescription: Prescription.TimedHold({ holdSec: 45, sets: 3 }),
    role: "accessory",
    sets: [
      { completed: true, holdSec: 45, rpe: 7.5 },
      { completed: true, holdSec: 45 },
      { completed: true, holdSec: 45 },
    ],
    slotId: "plank-slot",
  }) as unknown as ExerciseResult;

const rowResult = (): ExerciseResult =>
  ({
    cardio: { distanceMeters: 5000, splitSecPer500: 111.4 },
    exerciseId: "row-ex",
    prescription: Prescription.DistanceCardio({
      distanceMeters: 5000,
      targetSplitSecPer500: 112,
    }),
    role: "secondary",
    sets: [],
    slotId: "row-slot",
  }) as unknown as ExerciseResult;

const session = (results: readonly ExerciseResult[]): WorkoutSession =>
  ({
    completedAt: "2026-08-10T18:58:00.000Z",
    estimatedDurationMin: 60,
    prescribedExercises: results.map((result) => ({
      role: (result as unknown as { role: string }).role,
      slotId: result.slotId,
    })),
    results,
    startedAt: "2026-08-10T18:00:00.000Z",
  }) as unknown as WorkoutSession;

const names = new Map([
  ["squat-ex", "Back Squat"],
  ["split-ex", "Bulgarian Split Squat"],
  ["plank-ex", "Plank"],
  ["row-ex", "Zone 2 Row"],
]);

describe("loggedSessionView", () => {
  it("ticks a strength lift done as prescribed and averages its RPE", () => {
    const view = loggedSessionView(session([strengthResult()]), names, []);
    const [squat] = view.exercises;
    expect(squat).toMatchObject({
      done: "5×5 ✓",
      isAsPrescribed: true,
      isPrimary: true,
      name: "Back Squat",
      prescribed: "5×5 @ 225 lb",
    });
    expect(squat?.avgRpe).toBe("7.8");
  });

  it("lists the per-set reps of a partial effort without a tick", () => {
    const view = loggedSessionView(session([partialBodyweight()]), names, []);
    const [split] = view.exercises;
    expect(split).toMatchObject({
      done: "3×10, 10, 8",
      isAsPrescribed: false,
      isPrimary: false,
      prescribed: "3×10 +25 lb",
    });
    expect(split?.avgRpe).toBe("8.5");
  });

  it("collapses a timed hold done as prescribed", () => {
    const view = loggedSessionView(session([holdResult()]), names, []);
    expect(view.exercises[0]).toMatchObject({
      done: "3× 45s ✓",
      prescribed: "3× 45s hold",
    });
  });

  it("reports a cardio piece from its logged distance and split", () => {
    const view = loggedSessionView(session([rowResult()]), names, []);
    expect(view.exercises[0]).toMatchObject({
      done: "5,000 m @ 1:51.4 /500m ✓",
      isAsPrescribed: true,
    });
  });

  it("summarizes the whole session and carries adaptation notes", () => {
    const view = loggedSessionView(
      session([strengthResult(), partialBodyweight()]),
      names,
      ["Increase Back Squat from 225 lb to 230 lb next session."],
    );
    expect(view.summary).toMatchObject({
      exerciseCount: 2,
      minutes: 58,
      totalSets: 8,
    });
    expect(view.summary.avgRpe).toBe("8.2");
    expect(view.notes).toEqual([
      "Increase Back Squat from 225 lb to 230 lb next session.",
    ]);
  });
});
