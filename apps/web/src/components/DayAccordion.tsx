"use client";

import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import type { ReactNode } from "react";
import { useState } from "react";
import { css } from "../../styled-system/css";

export type DayItem = {
  content: ReactNode;
  day: string;
  duration: string;
  id: string;
  name: string;
};

type Props = {
  items: readonly DayItem[];
};

/**
 * The block's days. On phones this is a single-open accordion — every day
 * starts collapsed and opening one closes the rest, with a height animation and
 * a caret. From `lg` up the disclosure is inert: CSS forces every day open and
 * hides the carets, so the wide layout shows the whole block at once. The open
 * day lives in state here (not per row) so the "close the others" behavior falls
 * out for free; desktop ignores it because its CSS always expands.
 */
export const DayAccordion = ({ items }: Props) => {
  const [openId, setOpenId] = useState<string | undefined>(undefined);
  return (
    <div className={listStyles}>
      {items.map((item) => {
        const open = item.id === openId;
        return (
          <section className={itemStyles} data-open={open} key={item.id}>
            <button
              aria-expanded={open}
              className={headerStyles}
              onClick={() => {
                setOpenId(open ? undefined : item.id);
              }}
              type="button"
            >
              <span className={headingStyles}>
                <span className={dayStyles}>{item.day}</span>
                <span className={nameStyles}>{item.name}</span>
              </span>
              <span className={trailingStyles}>
                <span className={durationStyles}>{item.duration}</span>
                <span className={caretStyles}>
                  <CaretRightIcon size={18} />
                </span>
              </span>
            </button>
            <div className={contentOuterStyles}>
              <div className={contentInnerStyles}>{item.content}</div>
            </div>
          </section>
        );
      })}
    </div>
  );
};

// A flush, hairline-grouped list on phones (rules top, between, and bottom);
// on desktop the rules move to each day's header and the days get real spacing.
const listStyles = css({
  borderBlockStart: "1px solid {colors.border}",
  display: "flex",
  flexDirection: "column",
  lg: { borderBlockStart: "none", gap: 12 },
});

const itemStyles = css({
  borderBlockEnd: "1px solid {colors.border}",
  lg: { borderBlockEnd: "none" },
});

const headerStyles = css({
  alignItems: "center",
  appearance: "none",
  backgroundColor: "transparent",
  border: "none",
  color: "inherit",
  cursor: "pointer",
  display: "flex",
  fontFamily: "inherit",
  gap: 3,
  inlineSize: "100%",
  justifyContent: "space-between",
  lg: {
    borderBlockEnd: "1px solid {colors.border}",
    cursor: "default",
    paddingBlock: 0,
    paddingBlockEnd: 2,
  },
  // Comfortable tap targets on phones; on desktop the header tightens to a
  // ruled title since the day is always open.
  paddingBlock: 4,
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
  "[data-open='true'] &": { transform: "rotate(90deg)" },
  color: "muted",
  display: "flex",
  lg: { display: "none" },
  transition: "transform {durations.fast} {easings.out}",
});

// Height animation via the grid-rows trick: the outer track animates 0fr → 1fr
// and the inner clips its overflow, so the content's real height is revealed
// without measuring it. Desktop pins the track open (1fr) with no transition.
const contentOuterStyles = css({
  "[data-open='true'] &": { gridTemplateRows: "1fr" },
  display: "grid",
  gridTemplateRows: "0fr",
  lg: { gridTemplateRows: "1fr" },
  transition: "grid-template-rows {durations.normal} {easings.out}",
});

const contentInnerStyles = css({
  minBlockSize: 0,
  overflow: "hidden",
  paddingBlockEnd: { base: 5, lg: 0 },
  paddingBlockStart: 3,
});
