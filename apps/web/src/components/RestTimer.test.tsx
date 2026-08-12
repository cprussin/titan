import { describe, expect, it } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";

import type { Alarm } from "../rest-alarm";
import { RestTimer } from "./RestTimer";

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

describe(RestTimer, () => {
  it("keeps counting past zero into negative time", () => {
    const { schedule, tick } = controllableSchedule();
    render(
      <RestTimer
        createAlarm={() => silentAlarm}
        initialSeconds={2}
        onFinish={() => undefined}
        schedule={schedule}
      />,
    );
    expect(screen.getByText("0:02")).toBeInTheDocument();
    tick();
    tick();
    expect(screen.getByText("0:00")).toBeInTheDocument();
    tick();
    expect(screen.getByText("-0:01")).toBeInTheDocument();
  });

  it("marks the running, warning, and overtime phases as it counts down", () => {
    const { schedule, tick } = controllableSchedule();
    const { container } = render(
      <RestTimer
        createAlarm={() => silentAlarm}
        initialSeconds={11}
        onFinish={() => undefined}
        schedule={schedule}
      />,
    );
    expect(container.querySelector('[data-phase="running"]')).not.toBeNull();
    tick();
    expect(container.querySelector('[data-phase="warning"]')).not.toBeNull();
    for (let count = 0; count < 10; count++) {
      tick();
    }
    expect(container.querySelector('[data-phase="overtime"]')).not.toBeNull();
  });

  it("beeps once each second through the final ten seconds", () => {
    const { schedule, tick } = controllableSchedule();
    let beeps = 0;
    const countingAlarm: Alarm = {
      start: () => undefined,
      stop: () => undefined,
      tick: () => {
        beeps += 1;
      },
    };
    render(
      <RestTimer
        createAlarm={() => countingAlarm}
        initialSeconds={11}
        onFinish={() => undefined}
        schedule={schedule}
      />,
    );
    // 11 → 10, 9, … 1 is ten beeps; reaching 0 hands off to the alarm.
    for (let count = 0; count < 11; count++) {
      tick();
    }
    expect(beeps).toBe(10);
  });

  it("sounds the alarm when the timer reaches zero", async () => {
    const { schedule, tick } = controllableSchedule();
    const started = new Promise<void>((resolve) => {
      render(
        <RestTimer
          createAlarm={() => ({
            start: resolve,
            stop: () => undefined,
            tick: () => undefined,
          })}
          initialSeconds={1}
          onFinish={() => undefined}
          schedule={schedule}
        />,
      );
    });
    tick();
    await started;
  });

  it("silences the alarm and ends the rest when Stop is pressed", async () => {
    const { schedule, tick } = controllableSchedule();
    let resolveStopped = () => undefined;
    const stopped = new Promise<void>((resolve) => {
      resolveStopped = resolve;
    });
    const finished = new Promise<void>((resolve) => {
      render(
        <RestTimer
          createAlarm={() => ({
            start: () => undefined,
            stop: resolveStopped,
            tick: () => undefined,
          })}
          initialSeconds={1}
          onFinish={resolve}
          schedule={schedule}
        />,
      );
    });
    tick();
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    await Promise.all([stopped, finished]);
  });

  it("silences the alarm when it unmounts", async () => {
    const { schedule, tick } = controllableSchedule();
    let resolveStopped = () => undefined;
    const stopped = new Promise<void>((resolve) => {
      resolveStopped = resolve;
    });
    const { unmount } = render(
      <RestTimer
        createAlarm={() => ({
          start: () => undefined,
          stop: resolveStopped,
          tick: () => undefined,
        })}
        initialSeconds={1}
        onFinish={() => undefined}
        schedule={schedule}
      />,
    );
    tick();
    unmount();
    await stopped;
  });

  it("adds thirty seconds when +30s is pressed", () => {
    const { schedule } = controllableSchedule();
    render(
      <RestTimer
        createAlarm={() => silentAlarm}
        initialSeconds={60}
        onFinish={() => undefined}
        schedule={schedule}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "+30s" }));
    expect(screen.getByText("1:30")).toBeInTheDocument();
  });
});
