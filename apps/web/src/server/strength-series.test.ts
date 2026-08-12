import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import type { WorkoutSession } from "@titan/domain/workout-session";
import { topStrengthSeries, topStrengthSeriesList } from "./strength-series";

const session = (id: string, date: string, weight: number): WorkoutSession => ({
  blockId: "b",
  dayOfWeek: 1,
  estimatedDurationMin: 60,
  id,
  prescribedExercises: [],
  programVersionId: "pv",
  results: [
    {
      exerciseId: "back-squat",
      id: `r-${id}`,
      prescription: Prescription.Strength({
        reps: 5,
        sets: 1,
        unit: "kg",
        weight,
      }),
      sets: [{ completed: true, reps: 5, setIndex: 0, weight }],
      slotId: "squat",
    },
  ],
  scheduledDate: date,
  sessionTemplateId: "heavy-lower",
  status: "completed",
  userId: "default",
  weekNumber: 1,
});

describe("topStrengthSeries", () => {
  it("returns a chronological estimated-1RM series for the most-logged lift", () => {
    const series = topStrengthSeries([
      session("s2", "2026-01-12", 235),
      session("s1", "2026-01-05", 225),
    ]);
    expect(series?.exerciseId).toBe("back-squat");
    expect(series?.unit).toBe("kg");
    expect(series?.values).toHaveLength(2);
    // chronological: earlier (225) before later (235), and increasing
    expect(series?.values[0]).toBeLessThan(series?.values[1] ?? 0);
  });

  it("returns undefined without weighted work", () => {
    expect(topStrengthSeries([])).toBeUndefined();
  });
});

const lift = (
  exerciseId: string,
  date: string,
  weight: number,
): WorkoutSession =>
  ({
    results: [
      {
        exerciseId,
        prescription: Prescription.Strength({ reps: 5, sets: 1, weight }),
        sets: [{ completed: true, reps: 5, weight }],
        slotId: exerciseId,
      },
    ],
    scheduledDate: date,
    status: "completed",
  }) as unknown as WorkoutSession;

describe("topStrengthSeriesList", () => {
  it("orders lifts by how often they were logged and caps at the limit", () => {
    const list = topStrengthSeriesList(
      [
        lift("back-squat", "2026-01-05", 225),
        lift("bench-press", "2026-01-06", 155),
        lift("back-squat", "2026-01-12", 230),
        lift("deadlift", "2026-01-13", 315),
      ],
      2,
    );
    expect(list.map((series) => series.exerciseId)).toEqual([
      "back-squat",
      "bench-press",
    ]);
    expect(list[0]?.values).toHaveLength(2);
  });

  it("is empty without weighted work", () => {
    expect(topStrengthSeriesList([], 2)).toEqual([]);
  });
});
