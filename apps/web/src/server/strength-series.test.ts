import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import type { WorkoutSession } from "@titan/domain/workout-session";
import { topStrengthSeries } from "./strength-series";

const session = (
  id: string,
  date: string,
  weightLb: number,
): WorkoutSession => ({
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
      prescription: Prescription.Strength({ reps: 5, sets: 1, weightLb }),
      sets: [{ completed: true, reps: 5, setIndex: 0, weightLb }],
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
    expect(series?.values).toHaveLength(2);
    // chronological: earlier (225) before later (235), and increasing
    expect(series?.values[0]).toBeLessThan(series?.values[1] ?? 0);
  });

  it("returns undefined without weighted work", () => {
    expect(topStrengthSeries([])).toBeUndefined();
  });
});
