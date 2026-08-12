import { describe, expect, it } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Prescription } from "@titan/domain/prescription";
import type { ExerciseResult } from "@titan/domain/result";
import type { PrescribedExercise } from "@titan/domain/workout-session";

import { CardioLogger } from "./CardioLogger";

// A scheduler the test drives by hand so it can advance the piece timer a second
// at a time without waiting on real time.
const controllableSchedule = () => {
  let onTick = () => undefined;
  const schedule = (tick: () => void) => {
    onTick = tick;
    return () => {
      onTick = () => undefined;
    };
  };
  const tick = () => {
    act(() => {
      onTick();
    });
  };
  return { schedule, tick };
};

const prescription = Prescription.DistanceCardio({ distanceMeters: 2000 });

const prescribed: PrescribedExercise = {
  exerciseId: "row1",
  prescription,
  role: "primary",
  slotId: "s1",
};

const noop = () => undefined;

type Overrides = {
  onComplete?: (result: ExerciseResult) => void;
  schedule?: (onTick: () => void) => () => void;
};

const renderLogger = (overrides: Overrides = {}) =>
  render(
    <CardioLogger
      busy={false}
      concept2Connected={false}
      modality={undefined}
      onComplete={overrides.onComplete ?? noop}
      prescribed={prescribed}
      sessionId="session-1"
    />,
  );

const renderLoggerWithSchedule = (schedule: Overrides["schedule"]) =>
  render(
    <CardioLogger
      busy={false}
      concept2Connected={false}
      modality={undefined}
      onComplete={noop}
      prescribed={prescribed}
      schedule={schedule}
      sessionId="session-1"
    />,
  );

describe(CardioLogger, () => {
  it("labels each entry via an associated field label", () => {
    renderLogger();
    expect(
      screen.getByRole("spinbutton", { name: "Distance (m)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Duration (m:ss)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("spinbutton", { name: "Avg HR (optional)" }),
    ).toBeInTheDocument();
    // The label is a real associated <label> (via Field), not a loose span.
    expect(
      screen.getByText("Distance (m)").closest("label"),
    ).toBeInTheDocument();
  });

  it("echoes the normalized duration as a hint once it parses", () => {
    renderLogger();
    const duration = screen.getByRole("textbox", { name: "Duration (m:ss)" });
    expect(screen.queryByText("10:00")).not.toBeInTheDocument();
    fireEvent.change(duration, { target: { value: "600" } });
    expect(screen.getByText("10:00")).toBeInTheDocument();
  });

  it("fills the duration field from the timer's elapsed time when it is used", () => {
    const { schedule, tick } = controllableSchedule();
    renderLoggerWithSchedule(schedule);
    const duration = screen.getByRole("textbox", { name: "Duration (m:ss)" });
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    for (let count = 0; count < 65; count++) {
      tick();
    }
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    fireEvent.click(screen.getByRole("button", { name: "Use time" }));
    expect(duration).toHaveValue("1:05");
  });

  it("completes with the parsed distance, duration, and derived split", async () => {
    const result = await new Promise<ExerciseResult>((resolve) => {
      renderLogger({ onComplete: resolve });
      fireEvent.change(
        screen.getByRole("spinbutton", { name: "Distance (m)" }),
        {
          target: { value: "1000" },
        },
      );
      fireEvent.change(
        screen.getByRole("textbox", { name: "Duration (m:ss)" }),
        { target: { value: "3:20" } },
      );
      fireEvent.click(screen.getByRole("button", { name: "Complete" }));
    });
    expect(result).toMatchObject({
      cardio: { distanceMeters: 1000, durationSec: 200, splitSecPer500: 100 },
      exerciseId: "row1",
      slotId: "s1",
    });
  });
});
