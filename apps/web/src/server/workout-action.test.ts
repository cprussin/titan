import { describe, expect, it } from "bun:test";
import type { WorkoutSession } from "@titan/domain/workout-session";
import type { Today } from "./today";
import { resolveWorkoutAction } from "./workout-action";

const date = "2026-08-09";

const today = (kind: Today["kind"]): Today => ({ kind }) as Today;

const session = (
  fields: Pick<WorkoutSession, "id" | "scheduledDate" | "status">,
): WorkoutSession => fields as unknown as WorkoutSession;

describe("resolveWorkoutAction", () => {
  it("continues an in-progress session scheduled for the day", () => {
    const action = resolveWorkoutAction(
      today("workout"),
      [session({ id: "s1", scheduledDate: date, status: "in-progress" })],
      date,
    );
    expect(action).toEqual({ kind: "continue", sessionId: "s1" });
  });

  it("starts today's workout when nothing is resumable", () => {
    const action = resolveWorkoutAction(today("workout"), [], date);
    expect(action).toEqual({ kind: "start" });
  });

  it("marks today done when its workout is already completed", () => {
    const action = resolveWorkoutAction(
      today("workout"),
      [session({ id: "s1", scheduledDate: date, status: "completed" })],
      date,
    );
    expect(action).toEqual({ kind: "done" });
  });

  it("still starts today when the only completed session is another day's", () => {
    const action = resolveWorkoutAction(
      today("workout"),
      [session({ id: "s1", scheduledDate: "2026-08-08", status: "completed" })],
      date,
    );
    expect(action).toEqual({ kind: "start" });
  });

  it("offers nothing on a rest day with no resumable session", () => {
    const action = resolveWorkoutAction(today("rest"), [], date);
    expect(action).toBeUndefined();
  });

  it("offers nothing when no program is placed", () => {
    const action = resolveWorkoutAction(today("no-program"), [], date);
    expect(action).toBeUndefined();
  });

  it("continues a resumable session even on a rest day", () => {
    const action = resolveWorkoutAction(
      today("rest"),
      [session({ id: "s2", scheduledDate: date, status: "in-progress" })],
      date,
    );
    expect(action).toEqual({ kind: "continue", sessionId: "s2" });
  });
});
