import { describe, expect, it } from "bun:test";
import { externalWorkoutSchema } from "@titan/domain/external";
import { repairLegacyHeartRate } from "./repair-legacy-heart-rate";

const legacyWorkout = {
  connectionId: "conn-1",
  externalId: "c2-1",
  id: "ext-1",
  importedAt: "2026-01-01T00:00:00.000Z",
  matchStatus: "unmatched",
  normalized: {
    intervals: [
      {
        avgHr: 0,
        distanceMeters: 500,
        durationSec: 112.5,
        index: 0,
        splitSecPer500: 112.5,
        strokeRate: 25,
      },
    ],
    summary: {
      avgHr: 0,
      avgStrokeRate: 24,
      distanceMeters: 2000,
      durationSec: 450,
      splitSecPer500: 112.5,
    },
    workoutAt: "2026-01-01T00:00:00",
  },
  provider: "concept2",
  raw: {},
  userId: "user-1",
};

describe("repairLegacyHeartRate", () => {
  it("drops a non-positive avgHr so a legacy row parses", () => {
    const parsed = externalWorkoutSchema.parse(
      repairLegacyHeartRate(legacyWorkout),
    );
    expect(parsed.normalized.summary.avgHr).toBeUndefined();
    expect(parsed.normalized.intervals[0]?.avgHr).toBeUndefined();
    expect(parsed.normalized.summary.distanceMeters).toBe(2000);
  });

  it("preserves a positive avgHr", () => {
    const withHr = {
      ...legacyWorkout,
      normalized: {
        ...legacyWorkout.normalized,
        summary: { ...legacyWorkout.normalized.summary, avgHr: 165 },
      },
    };
    const parsed = externalWorkoutSchema.parse(repairLegacyHeartRate(withHr));
    expect(parsed.normalized.summary.avgHr).toBe(165);
  });

  it("returns data without a normalized workout unchanged", () => {
    const data = { id: 42 };
    expect(repairLegacyHeartRate(data)).toBe(data);
  });
});
