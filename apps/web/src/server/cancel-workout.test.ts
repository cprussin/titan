import { describe, expect, it } from "bun:test";
import type { Db } from "@titan/db/client";
import type { WorkoutSession } from "@titan/domain/workout-session";
import { cancelWorkout } from "./cancel-workout";

const db = {} as Db;

const session = (status: WorkoutSession["status"]): WorkoutSession =>
  ({ id: "s1", status }) as unknown as WorkoutSession;

/** Records the ids passed to an injected delete, so a test can assert which
 *  rows a cancel touched (and in what order). */
const recorder = (log: string[], label: string) => (_db: Db, id: string) => {
  log.push(`${label}:${id}`);
  return Promise.resolve();
};

describe("cancelWorkout", () => {
  it("deletes the session and its adaptation decisions", async () => {
    const deleted: string[] = [];
    await cancelWorkout(
      db,
      "s1",
      () => Promise.resolve(session("in-progress")),
      recorder(deleted, "session"),
      recorder(deleted, "decisions"),
    );
    expect(deleted).toEqual(["decisions:s1", "session:s1"]);
  });

  it("throws when the session does not exist", async () => {
    const deleted: string[] = [];
    const track = recorder(deleted, "deleted");
    await expect(
      cancelWorkout(
        db,
        "missing",
        () => Promise.resolve(undefined),
        track,
        track,
      ),
    ).rejects.toThrow("workout session missing not found");
    expect(deleted).toEqual([]);
  });

  it("refuses to cancel a session that is not in progress", async () => {
    const deleted: string[] = [];
    const track = recorder(deleted, "deleted");
    await expect(
      cancelWorkout(
        db,
        "s1",
        () => Promise.resolve(session("completed")),
        track,
        track,
      ),
    ).rejects.toThrow("not in progress");
    expect(deleted).toEqual([]);
  });
});
