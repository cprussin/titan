import { describe, expect, it } from "bun:test";
import type { WorkoutSession } from "@titan/domain/workout-session";
import { findCompletedSession } from "./completed-session";

const session = (
  fields: Pick<WorkoutSession, "id" | "scheduledDate" | "status">,
): WorkoutSession => fields as unknown as WorkoutSession;

describe("findCompletedSession", () => {
  const date = "2026-08-05";

  it("returns the completed session scheduled for the date", () => {
    const target = session({
      id: "s1",
      scheduledDate: date,
      status: "completed",
    });
    const found = findCompletedSession(
      [
        session({ id: "s0", scheduledDate: "2026-08-04", status: "completed" }),
        target,
      ],
      date,
    );
    expect(found).toBe(target);
  });

  it("returns undefined when the date's session is still in progress", () => {
    const found = findCompletedSession(
      [session({ id: "s1", scheduledDate: date, status: "in-progress" })],
      date,
    );
    expect(found).toBeUndefined();
  });

  it("ignores completed sessions scheduled for a different date", () => {
    const found = findCompletedSession(
      [session({ id: "s1", scheduledDate: "2026-08-04", status: "completed" })],
      date,
    );
    expect(found).toBeUndefined();
  });
});
