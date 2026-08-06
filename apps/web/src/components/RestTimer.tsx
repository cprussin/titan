"use client";

import { useEffect, useState } from "react";
import { css } from "../../styled-system/css";
import { hstack, vstack } from "../../styled-system/patterns";
import { formatClock } from "../format";
import { Button } from "../ui";

type Props = {
  initialSeconds: number;
  onFinish: () => void;
};

/** A between-sets countdown. Ticks once per second, offers a +30s bump, and can
 *  be skipped. Calls `onFinish` when it reaches zero or is skipped. */
export const RestTimer = ({ initialSeconds, onFinish }: Props) => {
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    if (remaining <= 0) {
      onFinish();
      return undefined;
    } else {
      const timeout = setTimeout(() => {
        setRemaining((current) => current - 1);
      }, 1000);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [remaining, onFinish]);

  return (
    <div className={wrapStyles}>
      <span className={labelStyles}>Rest</span>
      <span className={timeStyles}>{formatClock(Math.max(0, remaining))}</span>
      <div className={hstack({ gap: 2 })}>
        <Button
          onClick={() => setRemaining((current) => current + 30)}
          size="sm"
          variant="outline"
        >
          +30s
        </Button>
        <Button onClick={onFinish} size="sm" variant="ghost">
          Skip rest
        </Button>
      </div>
    </div>
  );
};

// A soft accent wash marks the rest state — flat (no border), just a tint.
const wrapStyles = vstack({
  backgroundColor:
    "color-mix(in oklab, {colors.accent} 14%, {colors.background})",
  borderRadius: "xl",
  gap: 1,
  paddingBlock: 6,
  paddingInline: 4,
});

const labelStyles = css({
  color: "muted",
  fontSize: "xs",
  fontWeight: "medium",
  textTransform: "uppercase",
});

const timeStyles = css({
  fontFamily: "mono",
  fontSize: "5xl",
  fontWeight: "bold",
});
