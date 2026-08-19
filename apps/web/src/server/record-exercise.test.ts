import { describe, expect, it } from "bun:test";
import type { Db } from "@titan/db/client";
import type { ExerciseResult } from "@titan/domain/result";
import type { WorkoutSession } from "@titan/domain/workout-session";
import { RecordOutcome, recordExercise } from "./record-exercise";

const db = {} as Db;

const session = {
  id: "s1",
  results: [{ id: "r1", slotId: "slot-1" }],
  status: "in-progress",
} as unknown as WorkoutSession;

const recorded = {
  id: "r2",
  sets: [],
  slotId: "slot-2",
} as unknown as ExerciseResult;

/** Records what the conditional write was asked to store, and with which prior
 *  result count, so a test can assert the claim as well as the document. */
const capture = (
  claims: { count: number; written: WorkoutSession }[],
  stored: boolean,
) => {
  return (_db: Db, written: WorkoutSession, count: number) => {
    claims.push({ count, written });
    return Promise.resolve(stored);
  };
};

describe("recordExercise", () => {
  it("adds the exercise to the log it read, claiming the results it saw", async () => {
    const claims: { count: number; written: WorkoutSession }[] = [];
    const outcome = await recordExercise(
      db,
      "s1",
      recorded,
      () => Promise.resolve(session),
      capture(claims, true),
    );
    expect(outcome).toBe(RecordOutcome.Recorded);
    expect(claims.map((claim) => claim.count)).toEqual([1]);
    expect(
      claims.at(0)?.written.results.map((result) => result.slotId),
    ).toEqual(["slot-1", "slot-2"]);
  });

  it("reports the session closed when the write finds it no longer open", async () => {
    expect(
      await recordExercise(
        db,
        "s1",
        recorded,
        () => Promise.resolve(session),
        capture([], false),
      ),
    ).toBe(RecordOutcome.SessionClosed);
  });

  it("reports the session closed, writing nothing, when it is gone", async () => {
    const claims: { count: number; written: WorkoutSession }[] = [];
    expect(
      await recordExercise(
        db,
        "s1",
        recorded,
        () => Promise.resolve(undefined),
        capture(claims, true),
      ),
    ).toBe(RecordOutcome.SessionClosed);
    expect(claims).toEqual([]);
  });
});
