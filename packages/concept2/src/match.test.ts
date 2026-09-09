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

const intervalPiece = (
  count: number,
  distanceMeters: number,
  durationSec: number,
): NormalizedWorkout => ({
  intervals: Array.from({ length: count }, (_, index) => ({
    distanceMeters,
    durationSec,
    index,
  })),
  summary: {
    distanceMeters: distanceMeters * count,
    durationSec: durationSec * count,
  },
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

  it("is unmatched when the cardio session falls on an adjacent day", () => {
    // Both dates are the athlete's own calendar day — Concept2 stamps the
    // logbook in local time and `scheduledDate` is the local day the app
    // scheduled on — so a row from 2024-01-15 is not the 2024-01-16 session,
    // and a one-day window only lets a neighbouring day's piece claim it.
    const result = matchWorkout(rowing(2000), [
      session(
        "next-day",
        "2024-01-16",
        Rx.DistanceCardio({ distanceMeters: 2000 }),
      ),
    ]);
    expect(result).toEqual({ kind: MatchKind.Unmatched });
  });

  it("is unmatched when the day's cardio target is nowhere near the row", () => {
    const result = matchWorkout(rowing(2000), [
      session(
        "long-row",
        "2024-01-15",
        Rx.DistanceCardio({ distanceMeters: 10_000 }),
      ),
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

  it("ignores a piece rowed on an adjacent day", () => {
    // Yesterday's cool-down is not today's slot: the logbook date and
    // `scheduledDate` are both the athlete's local calendar day.
    const yesterday = {
      ...rowingFor(10_000, 2383),
      workoutAt: "2024-01-14T18:30:00",
    };
    expect(matchSlot(tenK, scheduledDate, [yesterday])).toBeUndefined();
  });

  describe("intervals", () => {
    const sixByFiveHundred = Rx.Intervals({
      count: 6,
      recoverySec: 120,
      workDistanceMeters: 500,
    });

    it("claims a piece rowed as the prescribed intervals", () => {
      const piece = intervalPiece(6, 500, 105);
      expect(matchSlot(sixByFiveHundred, scheduledDate, [piece])).toEqual(
        piece,
      );
    });

    it("rejects a continuous piece", () => {
      // The athlete warmed up with a straight 2k before the session. Its total
      // is a third shy of the 3 km the slot adds up to and, decisively, it was
      // not rowed as intervals at all — so it is not the slot's effort.
      expect(
        matchSlot(sixByFiveHundred, scheduledDate, [rowingFor(2000, 485)]),
      ).toBeUndefined();
    });

    it("rejects a piece rowed as a different interval shape", () => {
      // 3 × 1000 m covers exactly the 3 km the slot totals, so only the shape
      // of the piece tells the two sessions apart.
      expect(
        matchSlot(sixByFiveHundred, scheduledDate, [
          intervalPiece(3, 1000, 210),
        ]),
      ).toBeUndefined();
    });

    it("rejects a piece whose intervals are the wrong size", () => {
      // Six efforts totalling 3 km, but not six 500s — the worst interval
      // disqualifies the piece.
      const uneven: NormalizedWorkout = {
        intervals: [250, 750, 500, 500, 500, 500].map(
          (distanceMeters, index) => ({
            distanceMeters,
            durationSec: 105,
            index,
          }),
        ),
        summary: { distanceMeters: 3000, durationSec: 630 },
        workoutAt: "2024-01-15T08:30:00",
      };
      expect(
        matchSlot(sixByFiveHundred, scheduledDate, [uneven]),
      ).toBeUndefined();
    });

    it("judges a time-based slot on each interval's duration", () => {
      const fourByFour = Rx.Intervals({
        count: 4,
        recoverySec: 60,
        workSec: 240,
      });
      const piece = intervalPiece(4, 1100, 240);
      expect(matchSlot(fourByFour, scheduledDate, [piece])).toEqual(piece);
      expect(
        matchSlot(fourByFour, scheduledDate, [intervalPiece(4, 1100, 120)]),
      ).toBeUndefined();
    });
  });
});
