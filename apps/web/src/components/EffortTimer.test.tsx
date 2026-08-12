import { describe, expect, it } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";

import type { Alarm } from "../rest-alarm";
import { EffortTimer } from "./EffortTimer";

// A scheduler the test drives by hand: it captures the tick callback so a test
// can advance the clock one second at a time, deterministically.
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

const silentAlarm: Alarm = {
  start: () => undefined,
  stop: () => undefined,
  tick: () => undefined,
};

const noop = () => undefined;

describe(EffortTimer, () => {
  it("counts down from the prescribed target while running", () => {
    const { schedule, tick } = controllableSchedule();
    render(
      <EffortTimer
        createAlarm={() => silentAlarm}
        onUse={noop}
        schedule={schedule}
        targetSeconds={30}
      />,
    );
    expect(screen.getByText("0:30")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    tick();
    expect(screen.getByText("0:29")).toBeInTheDocument();
  });

  it("counts up from zero when there is no target duration", () => {
    const { schedule, tick } = controllableSchedule();
    render(
      <EffortTimer
        createAlarm={() => silentAlarm}
        onUse={noop}
        schedule={schedule}
      />,
    );
    expect(screen.getByText("0:00")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    tick();
    tick();
    expect(screen.getByText("0:02")).toBeInTheDocument();
  });

  it("chimes when the countdown reaches the target", async () => {
    const { schedule, tick } = controllableSchedule();
    const started = new Promise<void>((resolve) => {
      render(
        <EffortTimer
          createAlarm={() => ({ ...silentAlarm, start: resolve })}
          onUse={noop}
          schedule={schedule}
          targetSeconds={2}
        />,
      );
    });
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    tick();
    tick();
    await started;
  });

  it("reports the actual elapsed seconds to onUse", async () => {
    const { schedule, tick } = controllableSchedule();
    const used = new Promise<number>((resolve) => {
      render(
        <EffortTimer
          createAlarm={() => silentAlarm}
          onUse={resolve}
          schedule={schedule}
          targetSeconds={30}
        />,
      );
    });
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    tick();
    tick();
    tick();
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    fireEvent.click(screen.getByRole("button", { name: "Use time" }));
    expect(await used).toBe(3);
  });

  it("pauses when stopped and resumes where it left off", () => {
    const { schedule, tick } = controllableSchedule();
    render(
      <EffortTimer
        createAlarm={() => silentAlarm}
        onUse={noop}
        schedule={schedule}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    tick();
    tick();
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    tick();
    expect(screen.getByText("0:02")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    tick();
    expect(screen.getByText("0:03")).toBeInTheDocument();
  });

  it("resets back to the starting time", () => {
    const { schedule, tick } = controllableSchedule();
    render(
      <EffortTimer
        createAlarm={() => silentAlarm}
        onUse={noop}
        schedule={schedule}
        targetSeconds={30}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    tick();
    tick();
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByText("0:30")).toBeInTheDocument();
  });
});
