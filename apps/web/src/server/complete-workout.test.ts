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
});
