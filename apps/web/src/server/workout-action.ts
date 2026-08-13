import type { WorkoutSession } from "@titan/domain/workout-session";
import { findCompletedSession } from "./completed-session";
import { findResumableSession } from "./resumable-session";
import type { Today } from "./today";

/** The primary workout action surfaced app-wide (the FAB on phones, the sidebar
 *  button on wide screens). `continue` when an in-progress session exists for
 *  the day, `start` when today prescribes a workout that hasn't begun, and
 *  `done` once today's workout is finished — a terminal state with nothing left
 *  to launch. */
export type WorkoutAction =
  | { kind: "start" }
  | { kind: "continue"; sessionId: string }
  | { kind: "done" };

/**
 * Decide which workout action to offer. A resumable session always wins — it can
 * be continued regardless of what today resolves to. Otherwise, on a workout
 * day, today is `done` when its session is already finished and `start` when it
 * hasn't begun. Rest and no-program days offer nothing (`undefined`): there is
 * nothing to launch.
 */
export const resolveWorkoutAction = (
  today: Today,
  sessions: readonly WorkoutSession[],
  date: string,
): WorkoutAction | undefined => {
  const resumable = findResumableSession(sessions, date);
  if (resumable !== undefined) {
    return { kind: "continue", sessionId: resumable.id };
  } else if (today.kind === "workout") {
    return findCompletedSession(sessions, date) === undefined
      ? { kind: "start" }
      : { kind: "done" };
  } else {
    return undefined;
  }
};
