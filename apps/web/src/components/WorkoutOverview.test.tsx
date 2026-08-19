import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import type { OverviewExercise } from "../session-overview";
import { WorkoutOverview, WorkoutOverviewDialog } from "./WorkoutOverview";

const exercises: OverviewExercise[] = [
  {
    name: "Back Squat",
    sets: [
      { label: "Set 1", rpe: 7, value: "5 × 225 lb" },
      { label: "Set 2", rpe: undefined, value: "5 × 225 lb" },
    ],
    slotId: "slot-1",
    state: "done",
    target: "2×5 @ 225 lb",
  },
  {
    // A finished cardio piece: one effort, no set label and no rating.
    name: "Row",
    sets: [{ label: "", rpe: undefined, value: "2,000 m · 10:00" }],
    slotId: "slot-2",
    state: "done",
    target: "2,000 m",
  },
  {
    name: "Bench Press",
    sets: [{ label: "Set 1", rpe: 8, value: "5 × 135 lb" }],
    slotId: "slot-3",
    state: "current",
    target: "3×5 @ 135 lb",
  },
  {
    name: "Plank",
    sets: [],
    slotId: "slot-4",
    state: "upcoming",
    target: "3× 45s hold",
  },
];

describe(WorkoutOverview, () => {
  it("lists every exercise in the session with its target", () => {
    render(<WorkoutOverview exercises={exercises} />);
    expect(screen.getByText("Back Squat")).toBeInTheDocument();
    expect(screen.getByText("Bench Press")).toBeInTheDocument();
    expect(screen.getByText("Row")).toBeInTheDocument();
    expect(screen.getByText("Plank")).toBeInTheDocument();
    expect(screen.getByText("3× 45s hold")).toBeInTheDocument();
  });

  it("shows the work logged against each exercise with its rating", () => {
    render(<WorkoutOverview exercises={exercises} />);
    expect(screen.getByText("5 × 135 lb")).toBeInTheDocument();
    expect(screen.getByText("RPE 7")).toBeInTheDocument();
    expect(screen.queryByText("RPE")).not.toBeInTheDocument();
  });

  it("shows a finished cardio piece as its single effort", () => {
    render(<WorkoutOverview exercises={exercises} />);
    expect(screen.getByText("2,000 m · 10:00")).toBeInTheDocument();
  });

  it("gives a set list only to the exercises that logged work", () => {
    render(<WorkoutOverview exercises={exercises} />);
    // The session list itself plus one set list each for the three exercises
    // that have logged work; the upcoming one contributes none.
    expect(screen.getAllByRole("list")).toHaveLength(4);
  });

  it("marks the exercise in progress as the current step", () => {
    render(<WorkoutOverview exercises={exercises} />);
    expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent(
      "Bench Press",
    );
  });
});

describe(WorkoutOverviewDialog, () => {
  it("opens the overview from its trigger", () => {
    render(<WorkoutOverviewDialog exercises={exercises} />);
    expect(screen.queryByText("Back Squat")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Overview" }));
    expect(screen.getByText("Back Squat")).toBeInTheDocument();
  });
});
