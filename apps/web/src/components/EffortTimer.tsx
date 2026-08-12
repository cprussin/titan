"use client";

import { useEffect, useMemo, useState } from "react";
import { css, cx } from "../../styled-system/css";
import { hstack, vstack } from "../../styled-system/patterns";
import { formatClock, formatSignedClock } from "../format";
import { createAlarm as defaultCreateAlarm } from "../rest-alarm";
import type { ScheduleTick } from "../tick-scheduler";
import { scheduleTick } from "../tick-scheduler";
import { Button } from "../ui";

type Props = {
  /** Handed the actual elapsed whole seconds when the athlete accepts the timed
   *  result — the logger wires it to the hold-seconds stepper or the duration
   *  field, so the timer fills in a value that could equally be typed by hand. */
  onUse: (seconds: number) => void;
  /** The prescribed duration, when the effort has one (a plank's hold, a timed
   *  row). The clock counts *down* from it, chiming at zero and running into
   *  overtime just like the rest timer, so the athlete gets a target cue while
   *  the recorded value stays the true elapsed time. Omitted for a piece whose
   *  duration is itself the result being measured (a row for time), where the
   *  clock counts *up* from zero instead. */
  targetSeconds?: number | undefined;
  /** Alarm factory, injected for testing; defaults to the Web Audio beep. */
  createAlarm?: typeof defaultCreateAlarm | undefined;
  /** Tick scheduler, injected for testing; defaults to a 1s `setInterval`. */
  schedule?: ScheduleTick | undefined;
};

type TimerPhase = "idle" | "running" | "warning" | "overtime";

/**
 * An optional timer for logging a plank or a rowing piece as it happens. Given a
 * prescribed {@link Props.targetSeconds} it counts down to zero, chimes, and
 * runs into overtime; without one it counts up from zero. Either way it tracks
 * the true elapsed time and, on "Use time", hands it to the logger. The manual
 * entry beside it stays usable, so the timer is a convenience, never the only
 * way to record the effort.
 */
export const EffortTimer = ({
  onUse,
  targetSeconds,
  createAlarm = defaultCreateAlarm,
  schedule = scheduleTick,
}: Props) => {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const alarm = useMemo(() => createAlarm(), [createAlarm]);

  const remaining =
    targetSeconds === undefined ? undefined : targetSeconds - elapsed;

  useEffect(() => {
    if (running) {
      return schedule(() => {
        setElapsed((current) => current + 1);
      });
    } else {
      return undefined;
    }
  }, [running, schedule]);

  // Countdown cues only, and only while the clock is live: a subtle blip through
  // the final ten seconds, then the chime takes over at the target. A count-up
  // timer (no target) has nothing to sound.
  useEffect(() => {
    if (running && remaining !== undefined) {
      if (remaining === 0) {
        alarm.start();
      } else if (remaining > 0 && remaining <= 10) {
        alarm.tick();
      }
    }
  }, [remaining, running, alarm]);

  // Pausing (Stop, Use, Reset) and unmounting all silence a chiming alarm.
  useEffect(() => {
    if (!running) {
      alarm.stop();
    }
  }, [running, alarm]);

  useEffect(
    () => () => {
      alarm.stop();
    },
    [alarm],
  );

  const reset = () => {
    setRunning(false);
    setElapsed(0);
  };

  return (
    <div className={wrapStyles} data-phase={timerPhase(running, remaining)}>
      <span className={labelStyles}>Timer</span>
      <span className={timeStyles} data-time="">
        {remaining === undefined
          ? formatClock(elapsed)
          : formatSignedClock(remaining)}
      </span>
      <div className={hstack({ gap: 2 })}>
        <Button
          onClick={() => setRunning((value) => !value)}
          size="sm"
          variant={running ? "outline" : "accent"}
        >
          {primaryLabel(running, elapsed)}
        </Button>
        {!running && elapsed > 0 && (
          <>
            <Button onClick={() => onUse(elapsed)} size="sm" variant="success">
              Use time
            </Button>
            <Button onClick={reset} size="sm" variant="ghost">
              Reset
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

/** The primary button's label: it starts a fresh clock, stops a running one, and
 *  resumes a paused one. */
const primaryLabel = (running: boolean, elapsed: number): string => {
  if (running) {
    return "Stop";
  } else if (elapsed === 0) {
    return "Start";
  } else {
    return "Resume";
  }
};

/** Which visual state the clock is in. Only a countdown reaches warning/overtime
 *  (its `remaining` crosses ten and then zero); a count-up clock is idle until
 *  started and plain "running" thereafter. */
const timerPhase = (
  running: boolean,
  remaining: number | undefined,
): TimerPhase => {
  if (remaining !== undefined && remaining <= 0) {
    return "overtime";
  } else if (remaining !== undefined && remaining <= 10) {
    return "warning";
  } else if (running) {
    return "running";
  } else {
    return "idle";
  }
};

// A soft accent wash marks the timer, deepening while it runs. The `data-phase`
// hook drives the countdown-specific treatment: overtime turns a bold danger
// wash so an overrun reads at a glance, and the final-ten-seconds flash lives on
// the time itself (see `timeStyles`) so only the number pulses.
const wrapStyles = cx(
  vstack({
    borderRadius: "xl",
    gap: 1,
    paddingBlock: 5,
    paddingInline: 4,
  }),
  css({
    "&[data-phase='idle']": {
      backgroundColor:
        "color-mix(in oklab, {colors.accent} 8%, {colors.background})",
    },
    "&[data-phase='overtime']": {
      backgroundColor:
        "color-mix(in oklab, {colors.danger} 40%, {colors.background})",
    },
    "&[data-phase='running'], &[data-phase='warning']": {
      backgroundColor:
        "color-mix(in oklab, {colors.accent} 16%, {colors.background})",
    },
    "&[data-phase='warning'] [data-time], &[data-phase='overtime'] [data-time]":
      {
        animationDuration: "{durations.pulse}",
        animationIterationCount: "infinite",
        animationName: "pulse",
        animationTimingFunction: "{easings.in-out}",
      },
  }),
);

const labelStyles = css({
  color: "muted",
  fontSize: "xs",
  fontWeight: "medium",
  textTransform: "uppercase",
});

const timeStyles = css({
  fontFamily: "mono",
  fontSize: "5xl",
  // A clock that shifts width as it counts is a bug.
  fontVariantNumeric: "tabular-nums",
  fontWeight: "bold",
});
