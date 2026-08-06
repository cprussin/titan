import { describe, expect, it } from "bun:test";
import type { Db } from "@titan/db/client";
import { deleteWorkout } from "./delete-workout";

const db = {} as Db;

/** Records the id passed to an injected delete, so a test can assert which rows
 *  a delete touched. */
const recorder = (log: string[], label: string) => (_db: Db, id: string) => {
  log.push(`${label}:${id}`);
  return Promise.resolve();
};

describe("deleteWorkout", () => {
  it("deletes the session and its adaptation decisions, regardless of status", async () => {
    const deleted: string[] = [];
    await deleteWorkout(
      db,
      "s1",
      recorder(deleted, "session"),
      recorder(deleted, "decisions"),
    );
    expect(deleted).toEqual(["session:s1", "decisions:s1"]);
  });
});
