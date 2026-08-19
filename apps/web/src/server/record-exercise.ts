import type { Db } from "@titan/db/client";
import {
  getWorkoutSession as defaultGetSession,
  updateInProgressWorkoutSession as defaultUpdateSession,
} from "@titan/db/workout-sessions";
import type { ExerciseResult } from "@titan/domain/result";
import { recordWorkoutResults } from "./record-workout-results";

/** Whether an exercise made it into the session's log. `SessionClosed` covers
 *  every reason it didn't: the session was finished, cancelled, or moved on by
 *  another device between this call's read and its write. */
export enum RecordOutcome {
  Recorded,
  SessionClosed,
}

/**
 * Add a finished exercise to a session's log. The write claims the very row this
 * call read, so a session closed or advanced in between is reported back rather
 * than overwritten from the older view. The db reads/writes are injected so the
 * outcome is unit-testable (see TESTING.md).
 */
export const recordExercise = async (
  db: Db,
  sessionId: string,
  recorded: ExerciseResult,
  getWorkoutSession: typeof defaultGetSession = defaultGetSession,
  updateInProgressWorkoutSession: typeof defaultUpdateSession = defaultUpdateSession,
): Promise<RecordOutcome> => {
  const session = await getWorkoutSession(db, sessionId);
  if (session === undefined) {
    return RecordOutcome.SessionClosed;
  } else {
    const stored = await updateInProgressWorkoutSession(
      db,
      recordWorkoutResults(session, recorded, new Date().toISOString()),
      session.results.length,
    );
    return stored ? RecordOutcome.Recorded : RecordOutcome.SessionClosed;
  }
};
