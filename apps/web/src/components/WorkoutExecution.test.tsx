import { describe, expect, it } from "bun:test";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { Prescription } from "@titan/domain/prescription";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import type { SetResult } from "@titan/domain/result";
import type { PrescribedExercise } from "@titan/domain/workout-session";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { WorkoutSaveOutcome } from "../save-workout-progress";
import type { ResumePoint } from "../server/resume-workout";
import { WorkoutProgressRequest } from "../workout-progress-request";
import { NavDrawerProvider } from "./NavDrawer";
import { WorkoutExecution } from "./WorkoutExecution";

// The router is a Next.js platform global supplied via context, so it's stubbed
// rather than injected; only the push to the finished workout is under test.
const stubRouter = (
  push: (href: string) => void,
  refresh: () => void,
): AppRouterInstance => ({
  back: () => undefined,
  forward: () => undefined,
  prefetch: () => undefined,
  push,
  refresh,
  replace: () => undefined,
});

const prescription = Prescription.Strength({ reps: 5, sets: 3, weight: 225 });

const prescribed = (
  slotId: string,
  exerciseId: string,
  exercisePrescription: PrescribedExercise["prescription"] = prescription,
): PrescribedExercise => ({
  exerciseId,
  prescription: exercisePrescription,
  progression: ProgressionPolicy.None(),
  role: "primary",
  slotId,
});

const loggedSet = (setIndex: number): SetResult => ({
  completed: true,
  reps: 5,
  rpe: 8,
  setIndex,
  weight: 225,
});

const fresh: ResumePoint = { index: 0, logged: [], results: [] };

type Options = {
  /** What the injected save reports back, so the screen's reaction to a session
   *  finished elsewhere can be exercised. */
  outcome?: WorkoutSaveOutcome;
  prescribedExercises?: readonly PrescribedExercise[];
  resume?: ResumePoint;
};

const renderScreen = ({
  outcome = WorkoutSaveOutcome.Saved,
  prescribedExercises = [
    prescribed("slot-1", "back-squat"),
    prescribed("slot-2", "bench-press"),
  ],
  resume = fresh,
}: Options = {}) => {
  const pushed: string[] = [];
  const saved: WorkoutProgressRequest[] = [];
  const refreshes = { count: 0 };
  render(
    <AppRouterContext.Provider
      value={stubRouter(
        (href) => {
          pushed.push(href);
        },
        () => {
          refreshes.count += 1;
        },
      )}
    >
      <NavDrawerProvider>
        <WorkoutExecution
          concept2Connected={false}
          exerciseModalities={{}}
          exerciseNames={{
            "back-squat": "Back Squat",
            "bench-press": "Bench Press",
            row: "Row",
          }}
          explanations={{}}
          prescribedExercises={prescribedExercises}
          resume={resume}
          save={(_sessionId, progress) => {
            saved.push(progress);
            return Promise.resolve(outcome);
          }}
          sessionId="session-1"
        />
      </NavDrawerProvider>
    </AppRouterContext.Provider>,
  );
  return { pushed, refreshes, saved };
};

/** Rate the set in progress — the logger withholds "Log set" until it is. */
const pickRpe = (value: number) => {
  fireEvent.click(screen.getByRole("button", { name: String(value) }));
};

describe(WorkoutExecution, () => {
  it("carries the sets logged so far into the workout overview", () => {
    renderScreen();
    pickRpe(8);
    fireEvent.click(screen.getByRole("button", { name: "Log set" }));
    fireEvent.click(screen.getByRole("button", { name: "Overview" }));
    const overview = within(screen.getByRole("dialog"));
    expect(overview.getByText("5 × 225 lb")).toBeInTheDocument();
    expect(overview.getByText("RPE 8")).toBeInTheDocument();
    expect(overview.getByText("Bench Press")).toBeInTheDocument();
  });

  it("opens the overview on a cardio piece, which logs nothing until it ends", () => {
    renderScreen({
      prescribedExercises: [
        prescribed(
          "slot-1",
          "row",
          Prescription.DistanceCardio({ distanceMeters: 2000 }),
        ),
        prescribed("slot-2", "back-squat"),
      ],
    });
    fireEvent.click(screen.getByRole("button", { name: "Overview" }));
    const overview = within(screen.getByRole("dialog"));
    expect(overview.getByText("Row")).toBeInTheDocument();
    expect(overview.getByText("2,000 m")).toBeInTheDocument();
  });

  it("saves the sets logged so far as each set is logged", () => {
    const { saved } = renderScreen();
    pickRpe(8);
    fireEvent.click(screen.getByRole("button", { name: "Log set" }));
    expect(saved).toEqual([
      WorkoutProgressRequest.Sets({
        sets: [loggedSet(0)],
        slotId: "slot-1",
      }),
    ]);
  });

  it("picks up at the exercise underway with its logged sets restored", () => {
    renderScreen({
      resume: {
        index: 1,
        logged: [loggedSet(0)],
        results: [
          {
            exerciseId: "back-squat",
            id: "r1",
            prescription,
            sets: [loggedSet(0)],
            slotId: "slot-1",
          },
        ],
      },
    });
    expect(
      screen.getByRole("heading", { name: "Bench Press" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Set 2 of 3")).toBeInTheDocument();
  });

  it("saves the correction when a logged set is edited", () => {
    const { saved } = renderScreen({
      resume: { ...fresh, logged: [loggedSet(0), loggedSet(1)] },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Increase Set 1 reps" }),
    );
    expect(saved.at(-1)).toEqual(
      WorkoutProgressRequest.Sets({
        sets: [{ ...loggedSet(0), reps: 6 }, loggedSet(1)],
        slotId: "slot-1",
      }),
    );
  });

  it("saves the shortened list when the last logged set is undone", () => {
    const { saved } = renderScreen({
      resume: { ...fresh, logged: [loggedSet(0), loggedSet(1)] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(saved.at(-1)).toEqual(
      WorkoutProgressRequest.Sets({ sets: [loggedSet(0)], slotId: "slot-1" }),
    );
  });

  it("records the exercise with every set logged against it", async () => {
    const sets = [loggedSet(0), loggedSet(1), loggedSet(2)];
    const { saved } = renderScreen({ resume: { ...fresh, logged: sets } });
    fireEvent.click(screen.getByRole("button", { name: "Complete exercise" }));
    await act(async () => undefined);
    expect(saved.at(-1)).toEqual({
      kind: "recorded",
      recorded: {
        exerciseId: "back-squat",
        id: expect.any(String),
        prescription,
        sets,
        slotId: "slot-1",
      },
    });
  });

  it("holds the athlete on the exercise rather than advancing when the session is closed", async () => {
    const { refreshes } = renderScreen({
      outcome: WorkoutSaveOutcome.SessionClosed,
      resume: { ...fresh, logged: [loggedSet(0), loggedSet(1), loggedSet(2)] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Complete exercise" }));
    await act(async () => undefined);
    expect(refreshes.count).toBe(1);
    // The recorded exercise never landed, so the screen stays on it rather than
    // moving on to the next one as a stored result would.
    expect(
      screen.getByRole("heading", { name: "Back Squat" }),
    ).toBeInTheDocument();
    expect(screen.getByText("All sets logged")).toBeInTheDocument();
  });

  it("lets the athlete act again when a refused save leaves them where they were", async () => {
    renderScreen({
      outcome: WorkoutSaveOutcome.SessionClosed,
      resume: { ...fresh, logged: [loggedSet(0), loggedSet(1), loggedSet(2)] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Complete exercise" }));
    await act(async () => undefined);
    // A refusal the refresh can't move them off — the session is open, another
    // device merely got there first — must not leave the screen stuck mid-save.
    expect(screen.getByRole("button", { name: "Back" })).toBeEnabled();
  });

  it("re-places the athlete instead of finishing when the last exercise finds the session closed", async () => {
    const { pushed, refreshes } = renderScreen({
      outcome: WorkoutSaveOutcome.SessionClosed,
      prescribedExercises: [prescribed("slot-1", "back-squat")],
      resume: { ...fresh, logged: [loggedSet(0), loggedSet(1), loggedSet(2)] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Complete exercise" }));
    await act(async () => undefined);
    expect(refreshes.count).toBe(1);
    expect(pushed).toEqual([]);
  });

  it("re-places the athlete when a logged set finds the session closed", async () => {
    const { refreshes } = renderScreen({
      outcome: WorkoutSaveOutcome.SessionClosed,
    });
    pickRpe(8);
    fireEvent.click(screen.getByRole("button", { name: "Log set" }));
    await act(async () => undefined);
    expect(refreshes.count).toBe(1);
  });
});
