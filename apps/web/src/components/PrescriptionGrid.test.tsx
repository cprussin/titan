import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { Prescription } from "@titan/domain/prescription";
import type { PrescribedExercise } from "@titan/domain/workout-session";
import { PrescriptionGrid } from "./PrescriptionGrid";

const exercise = (
  exerciseId: string,
  role: PrescribedExercise["role"],
  prescription: PrescribedExercise["prescription"],
): PrescribedExercise =>
  ({
    exerciseId,
    prescription,
    role,
    slotId: `${exerciseId}-slot`,
  }) as unknown as PrescribedExercise;

const names = new Map([
  ["squat", "Back Squat"],
  ["rdl", "Romanian Deadlift"],
]);

const exercises = [
  exercise(
    "squat",
    "primary",
    Prescription.Strength({ reps: 5, sets: 5, weight: 225 }),
  ),
  exercise(
    "rdl",
    "secondary",
    Prescription.Strength({ reps: 8, sets: 3, weight: 155 }),
  ),
];

const loaded = { isLoading: false as const, value: { exercises, names } };

describe(PrescriptionGrid, () => {
  it("renders each exercise with its scheme and load", () => {
    render(<PrescriptionGrid load={loaded} />);
    const squat = screen.getByRole("row", { name: /Back Squat/ });
    expect(squat).toHaveTextContent("5×5");
    expect(squat).toHaveTextContent("225 lb");
  });

  it("marks the primary lift and only the primary lift", () => {
    render(<PrescriptionGrid load={loaded} />);
    expect(screen.getByRole("row", { name: /Back Squat/ })).toHaveTextContent(
      "Primary",
    );
    expect(
      screen.getByRole("row", { name: /Romanian Deadlift/ }),
    ).not.toHaveTextContent("Primary");
  });

  it("defaults the load column header to Load", () => {
    render(<PrescriptionGrid load={loaded} />);
    expect(screen.getByRole("columnheader", { name: "Load" })).toBeDefined();
  });

  it("uses a projected-load header when asked", () => {
    render(
      <PrescriptionGrid
        load={{
          isLoading: false,
          value: { exercises, loadHeader: "Projected load", names },
        }}
      />,
    );
    expect(
      screen.getByRole("columnheader", { name: "Projected load" }),
    ).toBeDefined();
  });

  it("fills the ledger with placeholder rows while loading", () => {
    const { container } = render(
      <PrescriptionGrid load={{ isLoading: true }} />,
    );
    // Header defaults to "Load" and no real exercise text renders.
    expect(screen.getByRole("columnheader", { name: "Load" })).toBeDefined();
    expect(screen.queryByText("Back Squat")).toBeNull();
    expect(
      container.querySelectorAll("[data-skeleton]").length,
    ).toBeGreaterThan(0);
  });
});
