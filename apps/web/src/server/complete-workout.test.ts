import { describe, expect, it } from "bun:test";
import type { Db } from "@titan/db/client";
import type { ExerciseResult } from "@titan/domain/result";
import type { WorkoutSession } from "@titan/domain/workout-session";
import { CompletionOutcome, completeWorkout } from "./complete-workout";

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

/** A client that records every query issued through it. Everything completion
 *  does after claiming the session — personal records, the week advance — reads
 *  the database directly, so an empty log is the proof that none of it ran. */
const watchedDb = (queries: string[][]): Db =>
  ((strings: TemplateStringsArray) => {
    queries.push([...strings]);
    return Promise.resolve([]);
  }) as unknown as Db;

describe("completeWorkout", () => {
  it("runs nothing that follows a completion when the write finds the session closed", async () => {
    const queries: string[][] = [];
    const result = await completeWorkout(
      watchedDb(queries),
      "u1",
      "s1",
      recorded,
      () => Promise.resolve(session),
      () => Promise.resolve(false),
    );
    expect(result.outcome).toBe(CompletionOutcome.SessionClosed);
    expect(queries).toEqual([]);
  });

  it("claims the session against the results it read", async () => {
    const counts: number[] = [];
    await completeWorkout(
      watchedDb([]),
      "u1",
      "s1",
      recorded,
      () => Promise.resolve(session),
      (_db, _written, priorResultCount) => {
        counts.push(priorResultCount);
        return Promise.resolve(false);
      },
    );
    expect(counts).toEqual([session.results.length]);
  });

  it("reports the session closed, writing nothing, when it is gone", async () => {
    const attempted: WorkoutSession[] = [];
    const result = await completeWorkout(
      watchedDb([]),
      "u1",
      "s1",
      recorded,
      () => Promise.resolve(undefined),
      (_db, written) => {
        attempted.push(written);
        return Promise.resolve(true);
      },
    );
    expect(result.outcome).toBe(CompletionOutcome.SessionClosed);
    expect(attempted).toEqual([]);
  });

  // A finish the app saved offline is replayed when it reconnects; if the
  // first attempt landed but its response was lost, the replay finds the
  // session already closed by this very exercise.
  it("reports a replayed finish as completed, with the records it set", async () => {
    const finished = {
      id: "s1",
      results: [{ id: "r1", slotId: "slot-1" }, recorded],
      status: "completed",
    } as unknown as WorkoutSession;
    const record = { id: "pr1", workoutSessionId: "s1" };
    const result = await completeWorkout(
      watchedDb([]),
      "u1",
      "s1",
      recorded,
      () => Promise.resolve(finished),
      () => Promise.resolve(false),
      () =>
        Promise.resolve([
          record,
          { id: "pr0", workoutSessionId: "older" },
        ] as never),
    );
    expect(result).toEqual({
      outcome: CompletionOutcome.Completed,
      personalRecords: [record] as never,
    });
  });

  it("dates the completion by the time the app recorded the last exercise", async () => {
    const written: WorkoutSession[] = [];
    await completeWorkout(
      watchedDb([]),
      "u1",
      "s1",
      { ...recorded, recordedAt: "2020-01-01T10:00:00.000Z" },
      () => Promise.resolve(session),
      (_db, document) => {
        written.push(document);
        return Promise.resolve(false);
      },
    );
    expect(written.map((document) => document.completedAt)).toEqual([
      "2020-01-01T10:00:00.000Z",
    ]);
  });
});
