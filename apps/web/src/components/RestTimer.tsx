"use client";

import { useEffect, useMemo, useState } from "react";
import { css, cx } from "../../styled-system/css";
import { hstack, vstack } from "../../styled-system/patterns";
import { formatSignedClock } from "../format";
import { createAlarm as defaultCreateAlarm } from "../rest-alarm";
import { Button } from "../ui";

/** Schedules a repeating one-second tick, returning a canceler. Injected so
 *  tests can drive the clock by hand instead of waiting on real time. */
type ScheduleTick = (onTick: () => void) => () => void;

const defaultSchedule: ScheduleTick = (onTick) => {
  const id = setInterval(onTick, 1000);
  return () => {
    clearInterval(id);
  };
};

type Props = {
  initialSeconds: number;
  onFinish: () => void;
  /** Alarm factory, injected for testing; defaults to the Web Audio beep. */
  createAlarm?: typeof defaultCreateAlarm;
  /** Tick scheduler, injected for testing; defaults to a 1s `setInterval`. */
  schedule?: ScheduleTick;
};

/**
 * A between-sets countdown that runs *past* zero into overtime rather than
 * ending itself: it flashes in the final ten seconds, turns red and sounds an
 * alarm at zero, and keeps counting negative until the athlete presses Stop
 * (which silences the alarm and returns to logging). A +30s bump extends it.
 */
export const RestTimer = ({
  initialSeconds,
  onFinish,
  createAlarm = defaultCreateAlarm,
  schedule = defaultSchedule,
}: Props) => {
  const [remaining, setRemaining] = useState(initialSeconds);
  const alarm = useMemo(() => createAlarm(), [createAlarm]);

  useEffect(() => {
    const cancel = schedule(() => {
      setRemaining((current) => current - 1);
    });
    return cancel;
  }, [schedule]);

  useEffect(() => {
    if (remaining === 0) {
      alarm.start();
    }
  }, [remaining, alarm]);

  useEffect(
    () => () => {
      alarm.stop();
    },
    [alarm],
  );

  const stop = () => {
    alarm.stop();
    onFinish();
  };

  return (
    <div className={wrapStyles} data-phase={timerPhase(remaining)}>
      <span className={labelStyles}>Rest</span>
      <span className={timeStyles}>{formatSignedClock(remaining)}</span>
      <div className={hstack({ gap: 2 })}>
        <Button
          onClick={() => setRemaining((current) => current + 30)}
          size="sm"
          variant="outline"
        >
          +30s
        </Button>
        <Button onClick={stop} size="sm" variant="ghost">
          Stop
        </Button>
      </div>
    </div>
  );
};

type TimerPhase = "running" | "warning" | "overtime";

/** Which visual state the clock is in: normal, flashing in the last ten
 *  seconds, or over the limit at/after zero. */
const timerPhase = (remaining: number): TimerPhase => {
  if (remaining <= 0) {
    return "overtime";
  } else if (remaining <= 10) {
    return "warning";
  } else {
    return "running";
  }
};

// A soft accent wash marks the rest state — flat (no border), just a tint. The
// `data-phase` hook drives the count-specific treatment: the final ten seconds
// flash (the accent `pulse` keyframe), and overtime turns a danger wash so an
// overrun reads at a glance.
const wrapStyles = cx(
  vstack({
    borderRadius: "xl",
    gap: 1,
    paddingBlock: 6,
    paddingInline: 4,
  }),
  css({
    "&[data-phase='overtime']": {
      backgroundColor:
        "color-mix(in oklab, {colors.danger} 22%, {colors.background})",
    },
    "&[data-phase='running'], &[data-phase='warning']": {
      backgroundColor:
        "color-mix(in oklab, {colors.accent} 14%, {colors.background})",
    },
    "&[data-phase='warning']": {
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
