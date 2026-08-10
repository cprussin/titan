import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { Prescription } from "@titan/domain/prescription";
import type { SetResult } from "@titan/domain/result";
import type { PrescribedExercise } from "@titan/domain/workout-session";

import { StrengthLogger } from "./StrengthLogger";

const prescription = Prescription.Strength({ reps: 5, sets: 3, weight: 100 });

const prescribed: PrescribedExercise = {
  exerciseId: "e1",
  prescription,
  role: "primary",
  slotId: "s1",
};

const noop = () => undefined;

type Overrides = {
  logged?: readonly SetResult[];
  onComplete?: (result: unknown) => void;
  onEditSet?: (index: number, set: SetResult) => void;
  onLogSet?: (set: SetResult) => void;
  onUndoLastSet?: () => void;
};

const renderLogger = (overrides: Overrides = {}) =>
  render(
    <StrengthLogger
      busy={false}
      logged={overrides.logged ?? []}
      onComplete={overrides.onComplete ?? noop}
      onEditSet={overrides.onEditSet ?? noop}
      onLogSet={overrides.onLogSet ?? noop}
      onUndoLastSet={overrides.onUndoLastSet ?? noop}
      prescribed={prescribed}
      prescription={prescription}
    />,
  );

const loggedSet = (fields: Partial<SetResult>): SetResult => ({
  completed: true,
  setIndex: 0,
  ...fields,
});

describe(StrengthLogger, () => {
  it("logs the first set at the prescribed weight and reps", async () => {
    const set = await new Promise<SetResult>((resolve) => {
      renderLogger({ onLogSet: resolve });
      fireEvent.click(screen.getByRole("button", { name: "Log set" }));
    });
    expect(set).toMatchObject({
      completed: true,
      reps: 5,
      setIndex: 0,
      weight: 100,
    });
  });

  it("prefills a later set's weight from the last logged set while resetting reps to prescribed", async () => {
    const set = await new Promise<SetResult>((resolve) => {
      renderLogger({
        logged: [loggedSet({ reps: 3, weight: 115 })],
        onLogSet: resolve,
      });
      fireEvent.click(screen.getByRole("button", { name: "Log set" }));
    });
    expect(set).toMatchObject({ reps: 5, setIndex: 1, weight: 115 });
  });

  it("shows the sets already logged with edit controls", () => {
    renderLogger({ logged: [loggedSet({ reps: 5, weight: 100 })] });
    expect(
      screen.getByRole("button", { name: "Increase Set 1 weight" }),
    ).toBeInTheDocument();
  });

  it("edits an earlier set's weight in place", async () => {
    const edit = await new Promise<[number, SetResult]>((resolve) => {
      renderLogger({
        logged: [loggedSet({ reps: 5, weight: 100 })],
        onEditSet: (index, set) => {
          resolve([index, set]);
        },
      });
      fireEvent.click(
        screen.getByRole("button", { name: "Increase Set 1 weight" }),
      );
    });
    expect(edit[0]).toBe(0);
    expect(edit[1]).toMatchObject({ reps: 5, weight: 105 });
  });

  it("undoes the last logged set and prefills its values for re-logging", async () => {
    let undoCalled = false;
    const relogged = await new Promise<SetResult>((resolve) => {
      renderLogger({
        logged: [loggedSet({ reps: 3, weight: 120 })],
        onLogSet: resolve,
        onUndoLastSet: () => {
          undoCalled = true;
        },
      });
      fireEvent.click(screen.getByRole("button", { name: "Back" }));
      fireEvent.click(screen.getByRole("button", { name: "Log set" }));
    });
    expect(undoCalled).toBe(true);
    expect(relogged).toMatchObject({ reps: 3, weight: 120 });
  });

  it("completes the exercise with the logged sets", async () => {
    const logged = [
      loggedSet({ reps: 5, setIndex: 0, weight: 100 }),
      loggedSet({ reps: 5, setIndex: 1, weight: 100 }),
      loggedSet({ reps: 5, setIndex: 2, weight: 100 }),
    ];
    const result = await new Promise<{ sets: readonly SetResult[] }>(
      (resolve) => {
        renderLogger({ logged, onComplete: resolve });
        fireEvent.click(
          screen.getByRole("button", { name: "Complete exercise" }),
        );
      },
    );
    expect(result.sets).toEqual(logged);
  });
});
