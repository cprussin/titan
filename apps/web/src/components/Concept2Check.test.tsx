import { describe, expect, it, spyOn } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { NormalizedWorkout } from "@titan/domain/external";
import type { Concept2MatchResult } from "../concept2-match-result";
import { Concept2Check } from "./Concept2Check";

const normalized: NormalizedWorkout = {
  intervals: [],
  summary: { distanceMeters: 2000, durationSec: 450 },
  workoutAt: "2024-01-15T08:30:00",
};

const matched: Concept2MatchResult = { normalized, status: "matched" };
const unmatched: Concept2MatchResult = { status: "not-matched" };

const warmup: NormalizedWorkout = {
  intervals: [],
  summary: { distanceMeters: 2000, durationSec: 450 },
  workoutAt: "2024-01-15T08:12:00",
};
const cooldown: NormalizedWorkout = {
  intervals: [],
  summary: { distanceMeters: 2000, durationSec: 461 },
  workoutAt: "2024-01-15T09:38:00",
};
const ambiguous: Concept2MatchResult = {
  candidates: [warmup, cooldown],
  status: "ambiguous",
};

const settleAutoCheck = async (): Promise<HTMLElement> => {
  const button = await screen.findByRole("button", { name: "Check Concept2" });
  await waitFor(() => {
    expect(button).toBeEnabled();
  });
  return button;
};

describe(Concept2Check, () => {
  it("auto-checks on mount and transitions when a workout already matches", async () => {
    const found: NormalizedWorkout[] = [];
    render(
      <Concept2Check
        check={() => Promise.resolve(matched)}
        onFound={(workout) => found.push(workout)}
      />,
    );
    expect(await screen.findByText("Workout found")).toBeInTheDocument();
    expect(found).toEqual([normalized]);
  });

  it("stays quiet with a manual check button when nothing matches yet", async () => {
    render(
      <Concept2Check
        check={() => Promise.resolve(unmatched)}
        onFound={() => undefined}
      />,
    );
    await settleAutoCheck();
    expect(
      screen.queryByText(/no matching workout found/i),
    ).not.toBeInTheDocument();
  });

  it("prompts to retry or cancel when a manual check finds nothing", async () => {
    render(
      <Concept2Check
        check={() => Promise.resolve(unmatched)}
        onFound={() => undefined}
      />,
    );
    fireEvent.click(await settleAutoCheck());
    expect(
      await screen.findByText("No matching workout found, try again?"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("retries and transitions when the workout appears on a later check", async () => {
    const found: NormalizedWorkout[] = [];
    const queue: Concept2MatchResult[] = [unmatched, unmatched, matched];
    render(
      <Concept2Check
        check={() => Promise.resolve(queue.shift() ?? unmatched)}
        onFound={(workout) => found.push(workout)}
      />,
    );
    fireEvent.click(await settleAutoCheck());
    fireEvent.click(await screen.findByRole("button", { name: "Retry" }));
    await waitFor(() => {
      expect(found).toEqual([normalized]);
    });
    expect(screen.getByText("Workout found")).toBeInTheDocument();
  });

  it("cancel dismisses the prompt back to the check button", async () => {
    render(
      <Concept2Check
        check={() => Promise.resolve(unmatched)}
        onFound={() => undefined}
      />,
    );
    fireEvent.click(await settleAutoCheck());
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    expect(
      await screen.findByRole("button", { name: "Check Concept2" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/no matching workout found/i),
    ).not.toBeInTheDocument();
  });

  it("asks which row to use when more than one hits the target", async () => {
    // Two pieces on one prescription: nothing in the data picks between them,
    // so the athlete does — by the time each was rowed and what it covered.
    const found: NormalizedWorkout[] = [];
    render(
      <Concept2Check
        check={() => Promise.resolve(ambiguous)}
        onFound={(workout) => found.push(workout)}
      />,
    );
    expect(
      await screen.findByRole("button", { name: /08:12/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /09:38/ })).toBeInTheDocument();
    expect(found).toEqual([]);
  });

  it("logs the row the athlete picks out of the choices", async () => {
    const found: NormalizedWorkout[] = [];
    render(
      <Concept2Check
        check={() => Promise.resolve(ambiguous)}
        onFound={(workout) => found.push(workout)}
      />,
    );
    fireEvent.click(await screen.findByRole("button", { name: /09:38/ }));
    await waitFor(() => {
      expect(found).toEqual([cooldown]);
    });
  });

  it("stops polling once it has asked, so the choices hold still", async () => {
    // The background poll would otherwise keep firing under an open prompt and
    // re-ask on every tick.
    let checks = 0;
    render(
      <Concept2Check
        check={() => {
          checks += 1;
          return Promise.resolve(ambiguous);
        }}
        onFound={() => undefined}
      />,
    );
    await screen.findByRole("button", { name: /08:12/ });
    fireEvent.click(screen.getByRole("button", { name: "Not these" }));
    expect(checks).toBe(1);
  });

  it("surfaces a failure with a retry prompt instead of transitioning", async () => {
    const errorLog = spyOn(console, "error").mockImplementation(
      () => undefined,
    );
    try {
      const found: NormalizedWorkout[] = [];
      render(
        <Concept2Check
          check={() => Promise.reject(new Error("boom"))}
          onFound={(workout) => found.push(workout)}
        />,
      );
      fireEvent.click(await settleAutoCheck());
      expect(
        await screen.findByText("Couldn't reach Concept2. Try again?"),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cancel" }),
      ).toBeInTheDocument();
      expect(found).toEqual([]);
      expect(errorLog).toHaveBeenCalled();
    } finally {
      errorLog.mockRestore();
    }
  });
});
