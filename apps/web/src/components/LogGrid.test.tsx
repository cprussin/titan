import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { LoggedExercise } from "../server/logged-session-view";
import { LogGrid } from "./LogGrid";

const exercises: readonly LoggedExercise[] = [
  {
    avgRpe: "7.8",
    done: "5×5 ✓",
    isAsPrescribed: true,
    isPrimary: true,
    name: "Back Squat",
    prescribed: "5×5 @ 225 lb",
  },
  {
    avgRpe: "8.5",
    done: "3×10, 10, 8",
    isAsPrescribed: false,
    isPrimary: false,
    name: "Bulgarian Split Squat",
    prescribed: "3×10 +25 lb",
  },
];

describe(LogGrid, () => {
  it("renders prescribed, done, and average RPE for each exercise", () => {
    render(<LogGrid exercises={exercises} />);
    const squat = screen.getByRole("row", { name: /Back Squat/ });
    expect(squat).toHaveTextContent("5×5 @ 225 lb");
    expect(squat).toHaveTextContent("5×5 ✓");
    expect(squat).toHaveTextContent("7.8");
  });

  it("has the Prescribed, Done, and Avg RPE column headers", () => {
    render(<LogGrid exercises={exercises} />);
    expect(
      screen.getByRole("columnheader", { name: "Prescribed" }),
    ).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "Done" })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "Avg RPE" })).toBeDefined();
  });

  it("marks the primary lift", () => {
    render(<LogGrid exercises={exercises} />);
    expect(screen.getByRole("row", { name: /Back Squat/ })).toHaveTextContent(
      "Primary",
    );
  });

  it("falls back to a dash when a piece logged no RPE", () => {
    render(
      <LogGrid
        exercises={[{ ...exercises[0], avgRpe: undefined } as LoggedExercise]}
      />,
    );
    expect(screen.getByRole("row", { name: /Back Squat/ })).toHaveTextContent(
      "—",
    );
  });
});
