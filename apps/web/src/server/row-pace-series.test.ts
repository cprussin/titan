import { describe, expect, it } from "bun:test";
import type { ExternalWorkout } from "@titan/domain/external";
import type { WorkoutSession } from "@titan/domain/workout-session";
import { rowPaceSeries } from "./row-pace-series";

const rowedSession = (
  date: string,
  splitSecPer500: number | undefined,
  status: WorkoutSession["status"] = "completed",
): WorkoutSession =>
  ({
    results: [{ cardio: { splitSecPer500 }, sets: [] }],
    scheduledDate: date,
    status,
  }) as unknown as WorkoutSession;

const external = (workoutAt: string, splitSecPer500: number): ExternalWorkout =>
  ({
    normalized: { summary: { splitSecPer500 }, workoutAt },
  }) as unknown as ExternalWorkout;

describe("rowPaceSeries", () => {
  it("merges session and external splits oldest-first with the latest last", () => {
    const series = rowPaceSeries(
      [rowedSession("2026-01-10", 114)],
      [external("2026-01-05T07:00:00.000Z", 116)],
    );
    expect(series?.values).toEqual([116, 114]);
    expect(series?.latestSplitSec).toBe(114);
  });

  it("ignores results without a split and sessions that were not completed", () => {
    const series = rowPaceSeries(
      [
        rowedSession("2026-01-10", undefined),
        rowedSession("2026-01-11", 110, "in-progress"),
        rowedSession("2026-01-12", 112),
      ],
      [],
    );
    expect(series?.values).toEqual([112]);
  });

  it("is undefined when nothing rowed", () => {
    expect(rowPaceSeries([], [])).toBeUndefined();
  });
});
