import type { ExerciseResult } from "@titan/domain/result";
import type { WorkoutSession } from "@titan/domain/workout-session";

/**
 * Add the exercise the athlete just finished to the session's log, and clear the
 * sets underway that it accounts for.
 *
 * The caller sends only the exercise it recorded, never the log: the log is the
 * server's, so a device working from a stale view can add to it but can never
 * shrink or rewrite it. A slot recorded twice — a save retried after its response
 * was lost, say — replaces its earlier result in place rather than logging the
 * slot twice, so recording is idempotent per slot.
 *
 * The time is stamped here, so only the server decides when a result was
 * recorded, and a replacement keeps the time its slot was first recorded: the
 * log is read as a timeline (see `session-duration.ts`), so a slot re-recorded
 * later must not jump ahead of the pieces that followed it.
 */
export const recordWorkoutResults = (
  session: WorkoutSession,
  recorded: ExerciseResult,
  now: string,
): WorkoutSession => {
  const prior = session.results.find(
    (result) => result.slotId === recorded.slotId,
  );
  const stamped = { ...recorded, recordedAt: prior?.recordedAt ?? now };
  return {
    ...session,
    inProgress: undefined,
    results:
      prior === undefined
        ? [...session.results, stamped]
        : session.results.map((result) =>
            result.slotId === recorded.slotId ? stamped : result,
          ),
  };
};
