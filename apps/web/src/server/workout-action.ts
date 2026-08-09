import type { WorkoutSession } from "@titan/domain/workout-session";
import { findResumableSession } from "./resumable-session";
import type { Today } from "./today";

/** The primary workout action surfaced app-wide (the FAB on phones, the sidebar
 *  button on wide screens). `continue` when an in-progress session exists for
 *  the day, `start` when today prescribes a workout that hasn't begun. */
export type WorkoutAction =
  | { kind: "start" }
  | { kind: "continue"; sessionId: string };

/**
 * Decide which workout action to offer. A resumable session always wins — it can
 * be continued regardless of what today resolves to — otherwise a `start` is
 * offered only when today is a workout day. Rest and no-program days offer
 * nothing (`undefined`): there is nothing to launch.
 */
export const resolveWorkoutAction = (
  today: Today,
  sessions: readonly WorkoutSession[],
  date: string,
): WorkoutAction | undefined => {
  const resumable = findResumableSession(sessions, date);
  if (resumable === undefined) {
    return today.kind === "workout" ? { kind: "start" } : undefined;
  } else {
    return { kind: "continue", sessionId: resumable.id };
  }
};
