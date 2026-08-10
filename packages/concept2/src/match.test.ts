import { describe, expect, it } from "bun:test";
import type { NormalizedWorkout } from "@titan/domain/external";
import type { Prescription } from "@titan/domain/prescription";
import { Prescription as Rx } from "@titan/domain/prescription";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import type { WorkoutSession } from "@titan/domain/workout-session";
import { MatchKind, matchWorkout } from "./match";

const session = (
  id: string,
  scheduledDate: string,
  prescription: Prescription,
): WorkoutSession => ({
  blockId: "block-1",
  dayOfWeek: 3,
  estimatedDurationMin: 40,
  id,
  prescribedExercises: [
    {
      exerciseId: "row",
      prescription,
      progression: ProgressionPolicy.None(),
      role: "primary",
      slotId: "slot-row",
    },
  ],
  programVersionId: "pv-1",
  results: [],
  scheduledDate,
  sessionTemplateId: "tmpl-1",
  status: "scheduled",
  userId: "user-1",
  weekNumber: 1,
});

const rowing = (distanceMeters: number): NormalizedWorkout => ({
  intervals: [],
  summary: { distanceMeters, durationSec: 450 },
  workoutAt: "2024-01-15T08:30:00",
});

describe("matchWorkout", () => {
  it("matches the same-day cardio session", () => {
    const result = matchWorkout(rowing(2000), [
      session("s-1", "2024-01-15", Rx.DistanceCardio({ distanceMeters: 2000 })),
    ]);
    expect(result).toEqual({
      kind: MatchKind.Matched,
      workoutSessionId: "s-1",
    });
  });

  it("is unmatched when no cardio session falls on the workout's day", () => {
    const result = matchWorkout(rowing(2000), [
      session(
        "strength",
        "2024-01-15",
        Rx.Strength({ reps: 5, sets: 5, weight: 200 }),
      ),
      session(
        "other-day",
        "2024-01-16",
        Rx.DistanceCardio({ distanceMeters: 2000 }),
      ),
    ]);
    expect(result).toEqual({ kind: MatchKind.Unmatched });
  });

  it("is unmatched with no candidates at all", () => {
    expect(matchWorkout(rowing(2000), [])).toEqual({
      kind: MatchKind.Unmatched,
    });
  });

  it("breaks a same-day tie by closest target distance", () => {
    const result = matchWorkout(rowing(2000), [
      session("far", "2024-01-15", Rx.DistanceCardio({ distanceMeters: 5000 })),
      session(
        "near",
        "2024-01-15",
        Rx.DistanceCardio({ distanceMeters: 2100 }),
      ),
    ]);
    expect(result).toEqual({
      kind: MatchKind.Matched,
      workoutSessionId: "near",
    });
  });
});
