import { describe, expect, it } from "bun:test";
import {
  saveWorkoutProgress,
  WorkoutSaveOutcome,
} from "./save-workout-progress";
import { WorkoutProgressRequest } from "./workout-progress-request";

const progress = WorkoutProgressRequest.Sets({
  sets: [{ completed: true, reps: 5, rpe: 8, setIndex: 0, weight: 100 }],
  slotId: "s1",
});

type Call = { init: RequestInit; url: string };

/** A fetch that answers every request with the given status, recording where it
 *  was asked to send it and what. */
const respondWith = (status: number, sent: Call[] = []) => {
  const stub = (url: string | URL | Request, init?: RequestInit) => {
    if (init !== undefined) {
      sent.push({ init, url: String(url) });
    }
    return Promise.resolve(new Response(undefined, { status }));
  };
  return stub as typeof fetch;
};

describe("saveWorkoutProgress", () => {
  it("patches the session with the progress and reports it saved", async () => {
    const sent: Call[] = [];
    const outcome = await saveWorkoutProgress(
      "session-1",
      progress,
      respondWith(200, sent),
    );
    expect(outcome).toBe(WorkoutSaveOutcome.Saved);
    expect(sent).toEqual([
      {
        init: {
          body: JSON.stringify(progress),
          headers: { "content-type": "application/json" },
          method: "PATCH",
        },
        url: "/api/workouts/session-1",
      },
    ]);
  });

  it("reports a session the server has closed to further progress", async () => {
    expect(
      await saveWorkoutProgress("session-1", progress, respondWith(409)),
    ).toBe(WorkoutSaveOutcome.SessionClosed);
  });

  it("throws on any other failure rather than treating it as saved", async () => {
    await expect(
      saveWorkoutProgress("session-1", progress, respondWith(500)),
    ).rejects.toThrow("save failed: 500");
  });
});
