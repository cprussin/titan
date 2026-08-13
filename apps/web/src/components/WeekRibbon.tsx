"use client";

import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { css, cva, cx } from "../../styled-system/css";
import type { WeekDay } from "../server/week-schedule";
import { centeredScrollLeft, visibleDayCount } from "./week-ribbon-scroll";

type Props = {
  days: readonly WeekDay[];
  /** The day the page below is showing — its cell takes the accent border and
   *  `aria-current`, and reads "· TODAY" when it is also today. */
  selectedDate: string;
  /** Which week is shown: 0 is the current week, ±1 the adjacent ones. Drives
   *  the caret links and is carried on each day link. */
  weekOffset: number;
};

/** Each day cell asks for at least this much width; the strip fits as many
 *  whole cells as clear it. */
const MIN_CELL_REM = 8.5;
/** The gap between cells, matching the `gap: 2` (0.5rem) on the strip. */
const GAP_REM = 0.5;

/** The dashboard's week picker. Above `md` the caret links step whole weeks and
 *  seven equal-width day cells lay out as a static grid between them. Below `md`
 *  the carets give way to scroll buttons that page a horizontally-scrolling
 *  strip; the strip fits a whole number of equal-width days between the buttons
 *  and opens centered on the selected day. Each cell links the page to that day;
 *  today links back to the un-parameterized dashboard. */
export const WeekRibbon = ({ days, selectedDate, weekOffset }: Props) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Fit a whole number of equal-width days between the scroll buttons, re-fitting
  // on resize by publishing the count as `--visible-days` for the cells to divide
  // the strip by. Inert above `md`, where the cells lay out as a grid instead.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport === null) {
      return;
    }
    const rootFontSize =
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize) ||
      16;
    const fit = () => {
      const count = visibleDayCount({
        containerWidth: viewport.clientWidth,
        dayCount: days.length,
        gap: GAP_REM * rootFontSize,
        minCellWidth: MIN_CELL_REM * rootFontSize,
      });
      viewport.style.setProperty("--visible-days", String(count));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => {
      window.removeEventListener("resize", fit);
    };
  }, [days.length]);

  // On load, bring the selected day (today, by default) to the middle of the
  // strip so it anchors the view rather than sitting off-screen. Instant, not
  // animated — this is the opening position, not a navigation.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport === null) {
      return;
    }
    const current = viewport.querySelector("[aria-current]");
    if (!(current instanceof HTMLElement)) {
      return;
    }
    viewport.scrollLeft = centeredScrollLeft({
      cellOffset: current.offsetLeft,
      cellWidth: current.offsetWidth,
      maxScrollLeft: viewport.scrollWidth - viewport.clientWidth,
      viewportWidth: viewport.clientWidth,
    });
  }, []);

  const scrollByPage = useCallback((direction: -1 | 1) => {
    const viewport = viewportRef.current;
    if (viewport === null) {
      return;
    }
    viewport.scrollBy({
      behavior: "smooth",
      left: direction * viewport.clientWidth,
    });
  }, []);

  return (
    <nav aria-label="Training week" className={pickerStyles}>
      <Link
        aria-label="Previous week"
        className={weekCaretStyles}
        href={weekHref(weekOffset - 1)}
      >
        <CaretLeftIcon />
      </Link>
      <button
        aria-label="Scroll to earlier days"
        className={scrollButtonStyles}
        onClick={() => {
          scrollByPage(-1);
        }}
        type="button"
      >
        <CaretLeftIcon />
      </button>
      <div className={cellsStyles} ref={viewportRef}>
        {days.map((day) => (
          <WeekCell
            day={day}
            key={day.date}
            selected={day.date === selectedDate}
            weekOffset={weekOffset}
          />
        ))}
      </div>
      <button
        aria-label="Scroll to later days"
        className={scrollButtonStyles}
        onClick={() => {
          scrollByPage(1);
        }}
        type="button"
      >
        <CaretRightIcon />
      </button>
      <Link
        aria-label="Next week"
        className={weekCaretStyles}
        href={weekHref(weekOffset + 1)}
      >
        <CaretRightIcon />
      </Link>
    </nav>
  );
};

const WeekCell = ({
  day,
  selected,
  weekOffset,
}: {
  day: WeekDay;
  selected: boolean;
  weekOffset: number;
}) => (
  <Link
    aria-current={selected ? "page" : undefined}
    className={cellStyles({
      dimmed: day.isPast && !selected,
      selected,
    })}
    href={day.isToday ? "/" : dayHref(day.date, weekOffset)}
  >
    <span className={labelStyles({ accent: day.isToday || selected })}>
      {cellLabel(day)}
    </span>
    <span className={nameStyles({ tone: nameTone(day) })}>{cellName(day)}</span>
  </Link>
);

/** The link to a week: the bare dashboard for the current week, else `?week`. */
const weekHref = (offset: number): string =>
  offset === 0 ? "/" : `/?week=${offset}`;

/** The link to a specific day, carrying the week offset when it is not the
 *  current week. */
const dayHref = (date: string, weekOffset: number): string =>
  weekOffset === 0 ? `/?date=${date}` : `/?week=${weekOffset}&date=${date}`;

/** The micro-label, marking today so it always reads "· TODAY". */
const cellLabel = (day: WeekDay): string =>
  `${day.label}${day.isToday ? " · TODAY" : ""}`;

/** The session name, ticked once logged and standing in with "Rest" on an empty
 *  day. */
const cellName = (day: WeekDay): string => {
  switch (day.kind) {
    case "rest": {
      return "Rest";
    }
    case "planned": {
      return day.name;
    }
    case "logged": {
      return `${day.name} ✓`;
    }
  }
};

/** The name color: done in success, rest in muted, planned in the plain
 *  foreground. */
const nameTone = (day: WeekDay): "default" | "muted" | "success" => {
  switch (day.kind) {
    case "rest": {
      return "muted";
    }
    case "planned": {
      return "default";
    }
    case "logged": {
      return "success";
    }
  }
};

const pickerStyles = css({
  alignItems: "stretch",
  display: "flex",
  gap: 2,
});

// The shared square-arrow look worn by both the week carets and the scroll
// buttons, so the same affordance sits in the same place across breakpoints.
const arrowStyles = css({
  _hoverEnabled: { borderColor: "muted", color: "foreground" },
  alignItems: "center",
  appearance: "none",
  backgroundColor: "transparent",
  border: "1px solid {colors.border}",
  borderRadius: "md",
  color: "muted",
  cursor: "pointer",
  flexShrink: 0,
  fontFamily: "inherit",
  inlineSize: 8,
  justifyContent: "center",
  transition:
    "color {durations.fast} {easings.out}, border-color {durations.fast} {easings.out}",
});

// The carets page whole weeks; shown from `md` up, where the full week fits.
const weekCaretStyles = cx(
  arrowStyles,
  css({ display: { base: "none", md: "flex" } }),
);

// The scroll buttons page the day strip; shown below `md`, standing in for the
// scrollbar.
const scrollButtonStyles = cx(
  arrowStyles,
  css({ display: { base: "flex", md: "none" } }),
);

// A horizontally-scrolling strip below `md` (scrollbar hidden — the buttons
// drive it), an equal-column grid from `md` up.
const cellsStyles = css({
  "&::-webkit-scrollbar": { display: "none" },
  display: "flex",
  flex: 1,
  gap: 2,
  md: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    overflowX: "visible",
  },
  overflowX: "auto",
  position: "relative",
  scrollbarWidth: "none",
});

const cellStyles = cva({
  base: {
    _focusVisible: {
      outline: "0.125rem solid {colors.accent}",
      outlineOffset: "0.125rem",
    },
    _hoverEnabled: {
      backgroundColor: "color-mix(in oklab, {colors.accent} 10%, transparent)",
    },
    borderRadius: "md",
    display: "flex",
    // Divide the strip into a whole number of equal cells (`--visible-days`,
    // set by the fit effect); the grid takes over from `md` up.
    flexBasis:
      "calc((100% - (var(--visible-days, 1) - 1) * {spacing.2}) / var(--visible-days, 1))",
    flexDirection: "column",
    flexGrow: 0,
    flexShrink: 0,
    gap: 1,
    md: { flexBasis: "auto", minInlineSize: 0 },
    padding: 3,
    transition:
      "background {durations.fast} {easings.out}, border-color {durations.fast} {easings.out}, opacity {durations.fast} {easings.out}",
  },
  variants: {
    dimmed: {
      false: {},
      true: { opacity: 0.65 },
    },
    selected: {
      false: { border: "1px solid {colors.border}" },
      true: {
        backgroundColor:
          "color-mix(in oklab, {colors.accent} 15%, transparent)",
        border: "1px solid {colors.accent}",
      },
    },
  },
});

const labelStyles = cva({
  base: {
    fontSize: "xs",
    fontWeight: "bold",
    letterSpacing: "wide",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  variants: {
    accent: {
      false: { color: "textTertiary" },
      true: { color: "accent" },
    },
  },
});

const nameStyles = cva({
  base: {
    fontFamily: "condensed",
    fontSize: "sm",
    fontWeight: "semibold",
    lineHeight: "condensed",
    minInlineSize: 0,
  },
  variants: {
    tone: {
      default: { color: "foreground" },
      muted: { color: "muted" },
      success: { color: "success" },
    },
  },
});
