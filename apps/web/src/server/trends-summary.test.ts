import { describe, expect, it } from "bun:test";
import type { BodyMetric } from "@titan/domain/body-metric";
import { trendsSummary } from "./trends-summary";

const metric = (weightLb: number, date = "2026-01-01"): BodyMetric =>
  ({ date, weightLb }) as unknown as BodyMetric;

describe("trendsSummary", () => {
  it("is empty for no data", () => {
    const summary = trendsSummary([], [], []);
    expect(summary.latestWeightLb).toBeUndefined();
    expect(summary.weightDates).toEqual([]);
    expect(summary.weightSeries).toEqual([]);
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

  it("dates the charted weigh-ins oldest-first alongside their weights", () => {
    const summary = trendsSummary(
      [metric(180, "2026-01-12"), metric(184, "2026-01-05")],
      [],
      [],
    );
    expect(summary.weightDates).toEqual(["2026-01-05", "2026-01-12"]);
  });
});
