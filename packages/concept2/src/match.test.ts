import { describe, expect, it } from "bun:test";
import type { NormalizedWorkout } from "@titan/domain/external";
import type { Prescription } from "@titan/domain/prescription";
import { Prescription as Rx } from "@titan/domain/prescription";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import type {
  PrescribedExercise,
  WorkoutSession,
} from "@titan/domain/workout-session";
import { MatchKind, matchWorkout } from "./match";

const exercise = (
  slotId: string,
  prescription: Prescription,
): PrescribedExercise => ({
  exerciseId: "row",
  prescription,
  progression: ProgressionPolicy.None(),
  role: "primary",
  slotId,
});

const sessionWith = (
  id: string,
  scheduledDate: string,
  prescribedExercises: readonly PrescribedExercise[],
): WorkoutSession => ({
  blockId: "block-1",
  dayOfWeek: 3,
  estimatedDurationMin: 40,
  id,
  prescribedExercises: [...prescribedExercises],
  programVersionId: "pv-1",
  results: [],
  scheduledDate,
  sessionTemplateId: "tmpl-1",
  status: "scheduled",
  userId: "user-1",
  weekNumber: 1,
});

const session = (
  id: string,
  scheduledDate: string,
  prescription: Prescription,
): WorkoutSession =>
  sessionWith(id, scheduledDate, [exercise("slot-row", prescription)]);

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
      slotId: "slot-row",
      workoutSessionId: "s-1",
    });
  });

  it("is unmatched when no cardio session falls near the workout's day", () => {
    const result = matchWorkout(rowing(2000), [
      session(
        "strength",
        "2024-01-15",
        Rx.Strength({ reps: 5, sets: 5, weight: 200 }),
      ),
      session(
        "other-day",
        "2024-01-20",
        Rx.DistanceCardio({ distanceMeters: 2000 }),
      ),
    ]);
    expect(result).toEqual({ kind: MatchKind.Unmatched });
  });

  it("matches a cardio session one calendar day off", () => {
    // The athlete rows in the evening in a negative-offset timezone, so the
    // logbook's local day (2024-01-15) is a day behind the UTC day the app
    // scheduled the session on (2024-01-16). Strict same-day equality would
    // drop this match even though it is the session the row belongs to.
    const result = matchWorkout(rowing(2000), [
      session(
        "next-day",
        "2024-01-16",
        Rx.DistanceCardio({ distanceMeters: 2000 }),
      ),
    ]);
    expect(result).toEqual({
      kind: MatchKind.Matched,
      slotId: "slot-row",
      workoutSessionId: "next-day",
    });
  });

  it("prefers a same-day session over an adjacent-day one", () => {
    const result = matchWorkout(rowing(2000), [
      session(
        "adjacent",
        "2024-01-16",
        Rx.DistanceCardio({ distanceMeters: 2000 }),
      ),
      session(
        "same-day",
        "2024-01-15",
        Rx.DistanceCardio({ distanceMeters: 5000 }),
      ),
    ]);
    expect(result).toEqual({
      kind: MatchKind.Matched,
      slotId: "slot-row",
      workoutSessionId: "same-day",
    });
  });

  it("is unmatched when the nearest cardio session is more than a day off", () => {
    const result = matchWorkout(rowing(2000), [
      session("far", "2024-01-17", Rx.DistanceCardio({ distanceMeters: 2000 })),
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
      slotId: "slot-row",
      workoutSessionId: "near",
    });
  });

  it("matches the cardio exercise in a session whose target is closest", () => {
    // A single session prescribes both a 10k piece and a 500m cooldown row.
    // The imported 10k must bind to the 10k slot, not merely to the session
    // (whose first cardio exercise the old session-level match would have
    // picked regardless of distance).
    const mixed = sessionWith("mixed", "2024-01-15", [
      exercise("slot-10k", Rx.DistanceCardio({ distanceMeters: 10_000 })),
      exercise("slot-cooldown", Rx.DistanceCardio({ distanceMeters: 500 })),
    ]);
    expect(matchWorkout(rowing(10_000), [mixed])).toEqual({
      kind: MatchKind.Matched,
      slotId: "slot-10k",
      workoutSessionId: "mixed",
    });
    expect(matchWorkout(rowing(500), [mixed])).toEqual({
      kind: MatchKind.Matched,
      slotId: "slot-cooldown",
      workoutSessionId: "mixed",
    });
  });
});
