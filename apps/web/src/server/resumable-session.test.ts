import { describe, expect, it } from "bun:test";
import type { WorkoutSession } from "@titan/domain/workout-session";
import { findResumableSession } from "./resumable-session";

const session = (
  fields: Pick<WorkoutSession, "id" | "scheduledDate" | "status">,
): WorkoutSession => fields as unknown as WorkoutSession;

describe("findResumableSession", () => {
  const date = "2026-08-05";

  it("returns the in-progress session scheduled for the date", () => {
    const target = session({
      id: "s1",
      scheduledDate: date,
      status: "in-progress",
    });
    const found = findResumableSession(
      [
        session({ id: "s0", scheduledDate: "2026-08-04", status: "completed" }),
        target,
      ],
      date,
    );
    expect(found).toBe(target);
  });

  it("returns undefined when the date's session is already completed", () => {
    const found = findResumableSession(
      [session({ id: "s1", scheduledDate: date, status: "completed" })],
      date,
    );
    expect(found).toBeUndefined();
  });

  it("ignores in-progress sessions scheduled for a different date", () => {
    const found = findResumableSession(
      [
        session({
          id: "s1",
          scheduledDate: "2026-08-04",
          status: "in-progress",
        }),
      ],
      date,
    );
    expect(found).toBeUndefined();
  });
});
