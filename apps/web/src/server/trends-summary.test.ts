import { describe, expect, it } from "bun:test";
import type { BodyMetric } from "@titan/domain/body-metric";
import type { ExternalWorkout } from "@titan/domain/external";
import type { WorkoutSession } from "@titan/domain/workout-session";
import { trendsSummary } from "./trends-summary";

const metric = (weightLb: number): BodyMetric =>
  ({ weightLb }) as unknown as BodyMetric;

const external = (distanceMeters: number | undefined): ExternalWorkout =>
  ({
    normalized: { summary: { distanceMeters } },
  }) as unknown as ExternalWorkout;

const session = (
  status: WorkoutSession["status"],
  setCounts: readonly number[],
): WorkoutSession =>
  ({
    results: setCounts.map((count) => ({
      sets: Array.from({ length: count }, () => ({})),
    })),
    status,
  }) as unknown as WorkoutSession;

describe("trendsSummary", () => {
  it("is empty for no data", () => {
    const summary = trendsSummary([], [], []);
    expect(summary.latestWeightLb).toBeUndefined();
    expect(summary.weightChangeLb).toBeUndefined();
    expect(summary.weightSeries).toEqual([]);
    expect(summary.totalSets).toBe(0);
    expect(summary.rowingMeters).toBe(0);
    expect(summary.strength).toBeUndefined();
    expect(summary.strengthSeries).toEqual([]);
    expect(summary.rowPace).toBeUndefined();
  });

  it("takes the latest weight from the newest-first metrics and charts them oldest-first", () => {
    // Metrics arrive newest-first (the DB orders by date DESC).
    const summary = trendsSummary(
      [metric(180), metric(182), metric(184)],
      [],
      [],
    );
    expect(summary.latestWeightLb).toBe(180);
    expect(summary.weightSeries).toEqual([184, 182, 180]);
  });

  it("reports the change from the previous weigh-in (down since last)", () => {
    const summary = trendsSummary([metric(180), metric(182)], [], []);
    expect(summary.weightChangeLb).toBe(-2);
  });

  it("has no weight change from a single weigh-in", () => {
    const summary = trendsSummary([metric(180)], [], []);
    expect(summary.weightChangeLb).toBeUndefined();
  });

  it("counts sets only from completed sessions", () => {
    const summary = trendsSummary(
      [],
      [session("completed", [3, 2]), session("in-progress", [5])],
      [],
    );
    expect(summary.totalSets).toBe(5);
  });

  it("sums rowing distance, treating a missing distance as zero", () => {
    const summary = trendsSummary(
      [],
      [],
      [external(2000), external(undefined), external(500)],
    );
    expect(summary.rowingMeters).toBe(2500);
  });
});
