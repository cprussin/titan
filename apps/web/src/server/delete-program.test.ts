import { describe, expect, it } from "bun:test";
import type { Db } from "@titan/db/client";
import type { Program } from "@titan/domain/program";
import { deleteProgram } from "./delete-program";

const db = {} as Db;

const program: Program = {
  description: "A test program",
  goals: ["strength"],
  id: "p1",
  name: "Test Program",
};

/** Records the program id passed to an injected write, so a test can assert
 *  which db operations a deletion performed and in what order. */
const recorder =
  (log: string[], label: string) => (_db: Db, programId: string) => {
    log.push(`${label}:${programId}`);
    return Promise.resolve();
  };

describe("deleteProgram", () => {
  it("tombstones the program when it has logged workout history", async () => {
    const saved: Program[] = [];
    const touched: string[] = [];
    await deleteProgram(
      db,
      "p1",
      () => Promise.resolve(true),
      () => Promise.resolve(program),
      (_db, tombstoned) => {
        saved.push(tombstoned);
        return Promise.resolve();
      },
      recorder(touched, "clear"),
      recorder(touched, "delete"),
      () => "2026-08-09T00:00:00.000Z",
    );
    expect(saved).toEqual([
      { ...program, tombstonedAt: "2026-08-09T00:00:00.000Z" },
    ]);
    expect(touched).toEqual([]);
  });

  it("hard-deletes the program and clears active state when it has no history", async () => {
    const saved: Program[] = [];
    const touched: string[] = [];
    await deleteProgram(
      db,
      "p1",
      () => Promise.resolve(false),
      () => Promise.resolve(program),
      (_db, tombstoned) => {
        saved.push(tombstoned);
        return Promise.resolve();
      },
      recorder(touched, "clear"),
      recorder(touched, "delete"),
      () => "2026-08-09T00:00:00.000Z",
    );
    expect(saved).toEqual([]);
    expect(touched).toEqual(["clear:p1", "delete:p1"]);
  });

  it("throws when a program with history is missing", async () => {
    await expect(
      deleteProgram(
        db,
        "p1",
        () => Promise.resolve(true),
        () => Promise.resolve(undefined),
        () => Promise.resolve(),
        () => Promise.resolve(),
        () => Promise.resolve(),
        () => "2026-08-09T00:00:00.000Z",
      ),
    ).rejects.toThrow("p1");
  });
});
