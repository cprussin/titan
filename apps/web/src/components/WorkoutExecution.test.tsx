import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Prescription } from "@titan/domain/prescription";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import type { PrescribedExercise } from "@titan/domain/workout-session";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { NavDrawerProvider } from "./NavDrawer";
import { WorkoutExecution } from "./WorkoutExecution";

// The screen never navigates in these tests; the router is a Next.js platform
// global supplied via context, so it's stubbed rather than injected.
const stubRouter: AppRouterInstance = {
  back: () => undefined,
  forward: () => undefined,
  prefetch: () => undefined,
  push: () => undefined,
  refresh: () => undefined,
  replace: () => undefined,
};

const prescribed = (
  slotId: string,
  exerciseId: string,
  prescription: PrescribedExercise["prescription"] = Prescription.Strength({
    reps: 5,
    sets: 3,
    weight: 225,
  }),
): PrescribedExercise => ({
  exerciseId,
  prescription,
  progression: ProgressionPolicy.None(),
  role: "primary",
  slotId,
});

const renderScreen = (
  prescribedExercises: readonly PrescribedExercise[] = [
    prescribed("slot-1", "back-squat"),
    prescribed("slot-2", "bench-press"),
  ],
) =>
  render(
    <AppRouterContext.Provider value={stubRouter}>
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
          sessionId="session-1"
        />
      </NavDrawerProvider>
    </AppRouterContext.Provider>,
  );

describe(WorkoutExecution, () => {
  it("carries the sets logged so far into the workout overview", () => {
    renderScreen();
    fireEvent.click(screen.getByRole("button", { name: "8" }));
    fireEvent.click(screen.getByRole("button", { name: "Log set" }));
    fireEvent.click(screen.getByRole("button", { name: "Overview" }));
    const overview = within(screen.getByRole("dialog"));
    expect(overview.getByText("5 × 225 lb")).toBeInTheDocument();
    expect(overview.getByText("RPE 8")).toBeInTheDocument();
    expect(overview.getByText("Bench Press")).toBeInTheDocument();
  });

  it("opens the overview on a cardio piece, which logs nothing until it ends", () => {
    renderScreen([
      prescribed(
        "slot-1",
        "row",
        Prescription.DistanceCardio({ distanceMeters: 2000 }),
      ),
      prescribed("slot-2", "back-squat"),
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Overview" }));
    const overview = within(screen.getByRole("dialog"));
    expect(overview.getByText("Row")).toBeInTheDocument();
    expect(overview.getByText("2,000 m")).toBeInTheDocument();
  });
});
