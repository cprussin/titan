import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import type { ExerciseResult } from "@titan/domain/result";
import type { WorkoutSession } from "@titan/domain/workout-session";
import { sessionDurationMin } from "./session-duration";

const rowingResult = (
  durationSec: number,
  recordedAt?: string,
): ExerciseResult => ({
  cardio: { distanceMeters: 10_000, durationSec },
  exerciseId: "rower",
  id: `row-${durationSec}`,
  prescription: Prescription.DistanceCardio({ distanceMeters: 10_000 }),
  sets: [],
  slotId: "row",
  ...(recordedAt === undefined ? {} : { recordedAt }),
});

const strengthResult = (recordedAt?: string): ExerciseResult => ({
  exerciseId: "back-squat",
  id: "squat",
  prescription: Prescription.Strength({ reps: 5, sets: 1, weight: 100 }),
  sets: [{ completed: true, reps: 5, setIndex: 0, weight: 100 }],
  slotId: "squat",
  ...(recordedAt === undefined ? {} : { recordedAt }),
});

const sessionWith = (overrides: Partial<WorkoutSession>): WorkoutSession => ({
  blockId: "b",
  dayOfWeek: 1,
  estimatedDurationMin: 45,
  id: "session-1",
  prescribedExercises: [],
  programVersionId: "pv",
  results: [],
  scheduledDate: "2026-08-11",
  sessionTemplateId: "row-day",
  status: "completed",
  userId: "default",
  weekNumber: 1,
  ...overrides,
});

describe("sessionDurationMin", () => {
  describe("with per-piece timing", () => {
    it("uses the row's own duration for a piece done before the session opened", () => {
      // Rowed 39:43 on the erg, then opened and closed the Titan session a
      // minute later. The lone cardio piece occupies the whole 1-min session,
      // so that measured minute drops out and the row's 39:43 stands.
      const duration = sessionDurationMin(
        sessionWith({
          completedAt: "2026-08-11T18:01:00.000Z",
          results: [rowingResult(2383, "2026-08-11T18:01:00.000Z")],
          startedAt: "2026-08-11T18:00:00.000Z",
        }),
      );
      expect(duration).toBe(40);
    });

    it("adds a synced row on top of the non-cardio work in a mixed session", () => {
      // 40 min lifting (recorded at +40:00), then a 20-min erg row synced in
      // 30 s. Titan measured only 30 s of cardio, replaced by the 20-min row:
      // 40 min lifting + 20 min row = 60 min.
      const duration = sessionDurationMin(
        sessionWith({
          completedAt: "2026-08-11T18:40:30.000Z",
          results: [
            strengthResult("2026-08-11T18:40:00.000Z"),
            rowingResult(1200, "2026-08-11T18:40:30.000Z"),
          ],
          startedAt: "2026-08-11T18:00:00.000Z",
        }),
      );
      expect(duration).toBe(60);
    });

    it("does not double-count a row performed in the app", () => {
      // Same 40 min lifting, but the 20-min row was rowed with the app open —
      // Titan measured 20 min for it, which the row's own 20 min replaces.
      const duration = sessionDurationMin(
        sessionWith({
          completedAt: "2026-08-11T19:00:00.000Z",
          results: [
            strengthResult("2026-08-11T18:40:00.000Z"),
            rowingResult(1200, "2026-08-11T19:00:00.000Z"),
          ],
          startedAt: "2026-08-11T18:00:00.000Z",
        }),
      );
      expect(duration).toBe(60);
    });
  });

  describe("without per-piece timing (legacy results)", () => {
    it("falls back to the larger of wall-clock and total row duration", () => {
      // A pre-existing session with no recorded piece times still gets the row's
      // duration when the wall-clock span collapsed.
      const duration = sessionDurationMin(
        sessionWith({
          completedAt: "2026-08-11T18:01:00.000Z",
          results: [rowingResult(2383)],
          startedAt: "2026-08-11T18:00:00.000Z",
        }),
      );
      expect(duration).toBe(40);
    });

    it("keeps wall-clock time for a legacy session with no cardio", () => {
      const duration = sessionDurationMin(
        sessionWith({
          completedAt: "2026-08-11T18:45:00.000Z",
          results: [strengthResult()],
          startedAt: "2026-08-11T18:00:00.000Z",
        }),
      );
      expect(duration).toBe(45);
    });
  });

  it("floors a sub-minute measured session to one minute", () => {
    const duration = sessionDurationMin(
      sessionWith({
        completedAt: "2026-08-11T18:00:20.000Z",
        results: [],
        startedAt: "2026-08-11T18:00:00.000Z",
      }),
    );
    expect(duration).toBe(1);
  });

  it("falls back to the estimate when the session was never timed", () => {
    const duration = sessionDurationMin(
      sessionWith({ estimatedDurationMin: 45, results: [strengthResult()] }),
    );
    expect(duration).toBe(45);
  });
});
