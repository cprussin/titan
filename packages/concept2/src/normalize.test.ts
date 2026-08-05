import { describe, expect, it } from "bun:test";
import { normalizeWorkout } from "./normalize";

const rawWorkout = {
  date: "2024-01-15 08:30:00",
  distance: 2000,
  heart_rate: { average: 165 },
  id: 987,
  stroke_rate: 24,
  time: 4500,
  type: "rower",
  workout: {
    intervals: [
      {
        distance: 500,
        heart_rate: { average: 158 },
        stroke_rate: 25,
        time: 1125,
      },
      { distance: 500, stroke_rate: 26, time: 1130 },
    ],
  },
};

describe("normalizeWorkout", () => {
  it("summarizes distance, seconds, split, and rates", () => {
    const normalized = normalizeWorkout(rawWorkout);
    expect(normalized.summary).toEqual({
      avgHr: 165,
      avgStrokeRate: 24,
      distanceMeters: 2000,
      durationSec: 450,
      splitSecPer500: 112.5,
    });
  });

  it("preserves the wall-clock day as an ISO timestamp", () => {
    const normalized = normalizeWorkout(rawWorkout);
    expect(normalized.workoutAt).toBe("2024-01-15T08:30:00");
  });

  it("normalizes each interval with its own split", () => {
    const normalized = normalizeWorkout(rawWorkout);
    expect(normalized.intervals).toHaveLength(2);
    expect(normalized.intervals[0]).toEqual({
      avgHr: 158,
      distanceMeters: 500,
      durationSec: 112.5,
      index: 0,
      splitSecPer500: 112.5,
      strokeRate: 25,
    });
  });

  it("omits heart rate when the interval has none", () => {
    const normalized = normalizeWorkout(rawWorkout);
    expect(normalized.intervals[1]?.avgHr).toBeUndefined();
  });

  it("omits summary heart rate when the workout has none", () => {
    const { heart_rate, ...withoutHeartRate } = rawWorkout;
    const normalized = normalizeWorkout(withoutHeartRate);
    expect(normalized.summary.avgHr).toBeUndefined();
    expect(normalized.summary.avgStrokeRate).toBe(24);
  });
});
