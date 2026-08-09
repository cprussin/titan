import { describe, expect, it } from "bun:test";
import type { Db } from "@titan/db/client";
import { deleteHistory } from "./delete-history";

const db = {} as Db;

/** Records the user id passed to an injected delete, so a test can assert which
 *  tables a history wipe touched. */
const recorder =
  (log: string[], label: string) => (_db: Db, userId: string) => {
    log.push(`${label}:${userId}`);
    return Promise.resolve();
  };

describe("deleteHistory", () => {
  it("wipes the user's workouts, their adaptation decisions, and weigh-ins", async () => {
    const deleted: string[] = [];
    await deleteHistory(
      db,
      "u1",
      recorder(deleted, "sessions"),
      recorder(deleted, "decisions"),
      recorder(deleted, "body-metrics"),
    );
    expect(deleted).toEqual(["sessions:u1", "decisions:u1", "body-metrics:u1"]);
  });
});
