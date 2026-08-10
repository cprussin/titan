import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import type { ReadinessEntry } from "@titan/domain/readiness";
import type { PrescribedExercise } from "@titan/domain/workout-session";
import { adaptSession } from "./session-adaptation";

const slot = (
  exerciseId: string,
  role: PrescribedExercise["role"],
  sets: number,
): PrescribedExercise => ({
  exerciseId,
  prescription: Prescription.Strength({ reps: 5, sets, weight: 100 }),
  progression: ProgressionPolicy.None(),
  role,
  slotId: `slot-${exerciseId}`,
});

const plan: readonly PrescribedExercise[] = [
  slot("squat", "primary", 5),
  slot("rdl", "secondary", 3),
  slot("calf-raise", "accessory", 3),
];

const readiness = (
  overrides: Partial<ReadinessEntry> = {},
): ReadinessEntry => ({
  availableMinutes: 999,
  date: "2026-01-05",
  energy: 5,
  id: "readiness-1",
  sleepQuality: 5,
  soreness: 5,
  userId: "user-1",
  ...overrides,
});

const primaryPreserved = (result: readonly PrescribedExercise[]): void => {
  const squat = result.find((item) => item.exerciseId === "squat");
  expect(squat).toBeDefined();
  expect(squat?.prescription).toMatchObject({ sets: 5 });
};

describe("adaptSession", () => {
  it("leaves an easy, unconstrained session untouched", () => {
    const { plan: result, notes } = adaptSession(plan, readiness());
    expect(result).toEqual(plan);
    expect(notes).toHaveLength(0);
  });

  it("removes accessories first to fit the available time", () => {
    const { plan: result, notes } = adaptSession(
      plan,
      readiness({ availableMinutes: 15 }),
    );
    expect(result.some((item) => item.role === "accessory")).toBe(false);
    expect(notes.some((note) => note.action === "remove-accessory")).toBe(true);
    primaryPreserved(result);
  });

  it("sheds accessories under low readiness even with time to spare", () => {
    const { plan: result, notes } = adaptSession(
      plan,
      readiness({ energy: 1 }),
    );
    expect(result.some((item) => item.role === "accessory")).toBe(false);
    expect(result.some((item) => item.role === "secondary")).toBe(true);
    expect(notes.some((note) => note.action === "remove-accessory")).toBe(true);
    primaryPreserved(result);
  });

  it("never increases workload when readiness is high", () => {
    const { plan: result } = adaptSession(plan, readiness({ energy: 5 }));
    expect(result).toEqual(plan);
  });
});
