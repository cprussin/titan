"use client";

import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import type { ReactNode } from "react";
import { useState } from "react";
import { css } from "../../styled-system/css";

type Props = {
  children: ReactNode;
  day: string;
  duration: string;
  name: string;
};

/**
 * One day's workout, collapsible on phones and always open from `lg` up. Every
 * day starts collapsed; tapping the header toggles it. The collapse is driven by
 * a `data-open` attribute and CSS, so desktop simply forces the exercises
 * visible (and hides the caret) without a hydration flash — the server and
 * client both render collapsed, and the wide layout reveals the content anyway.
 */
export const DaySection = ({ children, day, duration, name }: Props) => {
  const [open, setOpen] = useState(false);
  return (
    <section data-open={open}>
      <button
        aria-expanded={open}
        className={headerStyles}
        onClick={() => {
          setOpen((value) => !value);
        }}
        type="button"
      >
        <span className={headingStyles}>
          <span className={dayStyles}>{day}</span>
          <span className={nameStyles}>{name}</span>
        </span>
        <span className={trailingStyles}>
          <span className={durationStyles}>{duration}</span>
          <span className={caretStyles}>
            <CaretRightIcon size={18} />
          </span>
        </span>
      </button>
      <div className={contentStyles}>{children}</div>
    </section>
  );
};

const headerStyles = css({
  alignItems: "center",
  appearance: "none",
  backgroundColor: "transparent",
  border: "none",
  borderBlockEnd: "1px solid {colors.border}",
  color: "inherit",
  cursor: "pointer",
  display: "flex",
  fontFamily: "inherit",
  gap: 3,
  inlineSize: "100%",
  justifyContent: "space-between",
  // On desktop the day is always open, so its header isn't a control.
  lg: { cursor: "default" },
  paddingBlockEnd: 2,
  textAlign: "start",
});

const headingStyles = css({
  alignItems: "flex-start",
  display: "flex",
  flexDirection: "column",
  gap: 0.5,
  minInlineSize: 0,
});

const dayStyles = css({
  color: "muted",
  fontSize: "xs",
  fontWeight: "medium",
  letterSpacing: "wide",
  textTransform: "uppercase",
});

const nameStyles = css({
  fontSize: "lg",
  fontWeight: "semibold",
  lg: { fontSize: "xl" },
});

const trailingStyles = css({
  alignItems: "center",
  color: "textTertiary",
  display: "flex",
  flexShrink: 0,
  gap: 2,
});

const durationStyles = css({
  fontSize: "sm",
  fontVariantNumeric: "tabular-nums",
});

const caretStyles = css({
  // Points down when its day is open; gone entirely on the always-open desktop.
  "[data-open='true'] &": { transform: "rotate(90deg)" },
  color: "muted",
  display: "flex",
  lg: { display: "none" },
  transition: "transform {durations.fast} {easings.out}",
});

const contentStyles = css({
  "[data-open='true'] &": { display: "block" },
  // Collapsed on phones until the day is opened; always shown from `lg` up.
  display: { base: "none", lg: "block" },
  paddingBlockEnd: { base: 5, lg: 0 },
  paddingBlockStart: 3,
});
