import { describe, expect, it } from "bun:test";
import type { NormalizedWorkout } from "@titan/domain/external";
import type { Prescription } from "@titan/domain/prescription";
import { Prescription as Rx } from "@titan/domain/prescription";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import type {
  PrescribedExercise,
  WorkoutSession,
} from "@titan/domain/workout-session";
import { MatchKind, matchSlot, matchWorkout } from "./match";

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

const rowingFor = (
  distanceMeters: number,
  durationSec: number,
): NormalizedWorkout => ({
  intervals: [],
  summary: { distanceMeters, durationSec },
  workoutAt: "2024-01-15T08:30:00",
});

const rowing = (distanceMeters: number): NormalizedWorkout =>
  rowingFor(distanceMeters, 450);

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

  it("breaks a same-day tie by the session whose target is closest", () => {
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

describe("matchSlot", () => {
  const scheduledDate = "2024-01-15";
  const tenK = Rx.DistanceCardio({ distanceMeters: 10_000 });

  it("claims the imported piece nearest the slot's distance target", () => {
    // The athlete rowed both a 10k and a 500m warm-up the same day; the 10k
    // slot must take the 10k, not whichever row was imported first.
    const tenKPiece = rowingFor(10_000, 2383);
    const result = matchSlot(tenK, scheduledDate, [
      rowingFor(500, 150),
      tenKPiece,
    ]);
    expect(result).toEqual(tenKPiece);
  });

  it("rejects a piece far outside the slot's target", () => {
    // A lone 500m sits 95% short of a 10k slot — the slot stays unmatched
    // rather than logging the warm-up as the piece.
    expect(
      matchSlot(tenK, scheduledDate, [rowingFor(500, 150)]),
    ).toBeUndefined();
  });

  it("ranks a timed slot by duration when it prescribes no distance", () => {
    const longRow = Rx.TimedCardio({ durationSec: 2400 });
    const recovery = Rx.TimedCardio({ durationSec: 1200 });
    const longPiece = rowingFor(10_000, 2383);
    const shortPiece = rowingFor(2000, 1180);
    const pieces = [longPiece, shortPiece];
    expect(matchSlot(longRow, scheduledDate, pieces)).toEqual(longPiece);
    expect(matchSlot(recovery, scheduledDate, pieces)).toEqual(shortPiece);
  });

  it("ignores a piece outside the day tolerance", () => {
    const farPiece = {
      ...rowingFor(10_000, 2383),
      workoutAt: "2024-01-20T08:30:00",
    };
    expect(matchSlot(tenK, scheduledDate, [farPiece])).toBeUndefined();
  });
});
