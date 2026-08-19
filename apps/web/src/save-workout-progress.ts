import type { WorkoutProgressRequest } from "./workout-progress-request";

/** What a progress save reports back. `SessionClosed` covers every state in
 *  which the server takes this save no further — the session finished on another
 *  device, finished by a call whose response this client never saw, cancelled
 *  and gone, or simply moved on while this screen was writing. The client cannot
 *  tell which from the save alone, so it refreshes and lets the page place the
 *  athlete: the finished workout, a "not found", or the position the session
 *  actually reached. */
export enum WorkoutSaveOutcome {
  SessionClosed,
  Saved,
}

/**
 * Persist where the athlete is in a session — after every logged set, and again
 * as each exercise is recorded — so a reload or another device resumes from it.
 * Any status other than the two outcomes throws, so the caller surfaces the
 * failure rather than treating the workout as saved.
 *
 * @param request - Issues the call; injected in tests, defaults to `fetch`.
 */
export const saveWorkoutProgress = async (
  sessionId: string,
  progress: WorkoutProgressRequest,
  request: typeof fetch = fetch,
): Promise<WorkoutSaveOutcome> => {
  const response = await request(`/api/workouts/${sessionId}`, {
    body: JSON.stringify(progress),
    headers: { "content-type": "application/json" },
    method: "PATCH",
  });
  if (response.ok) {
    return WorkoutSaveOutcome.Saved;
  } else if (response.status === 409) {
    return WorkoutSaveOutcome.SessionClosed;
  } else {
    throw new Error(`save failed: ${response.status}`);
  }
};
