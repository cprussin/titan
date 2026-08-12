import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { Prescription } from "@titan/domain/prescription";
import type { ExerciseResult } from "@titan/domain/result";

import { SessionLog } from "./SessionLog";

const names = new Map([
  ["back-squat", "Back Squat"],
  ["row", "Rowing"],
]);

const squat: ExerciseResult = {
  exerciseId: "back-squat",
  id: "r1",
  prescription: Prescription.Strength({ reps: 5, sets: 2, weight: 225 }),
  sets: [
    { completed: true, reps: 5, setIndex: 0, weight: 225 },
    { completed: true, reps: 5, setIndex: 1, weight: 230 },
  ],
  slotId: "s1",
};

const row: ExerciseResult = {
  cardio: { distanceMeters: 2000, durationSec: 480 },
  exerciseId: "row",
  id: "r2",
  prescription: Prescription.DistanceCardio({ distanceMeters: 2000 }),
  sets: [],
  slotId: "s2",
};

describe(SessionLog, () => {
  it("lists each logged set under its named exercise", () => {
    render(<SessionLog exerciseNames={names} results={[squat]} />);
    expect(screen.getByText("Back Squat")).toBeInTheDocument();
    expect(screen.getByText("Set 1")).toBeInTheDocument();
    expect(screen.getByText("5 × 225 lb")).toBeInTheDocument();
    expect(screen.getByText("5 × 230 lb")).toBeInTheDocument();
  });

  it("summarizes a cardio piece on one line", () => {
    render(<SessionLog exerciseNames={names} results={[row]} />);
    expect(screen.getByText("Rowing")).toBeInTheDocument();
    expect(screen.getByText("2,000 m · 8:00.0")).toBeInTheDocument();
  });
});
