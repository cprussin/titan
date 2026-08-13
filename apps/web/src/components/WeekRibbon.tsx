"use client";

import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { css, cva, cx } from "../../styled-system/css";
import type { Loadable } from "../loadable";
import type { WeekDay } from "../server/week-schedule";
import { Skeleton } from "../ui";
import { centeredScrollLeft, visibleDayCount } from "./week-ribbon-scroll";

export type WeekRibbonData = {
  days: readonly WeekDay[];
  /** The day the page below is showing — its cell takes the accent border and
   *  `aria-current`, and reads "· TODAY" when it is also today. */
  selectedDate: string;
  /** Which week is shown: 0 is the current week, ±1 the adjacent ones. Drives
   *  the caret links and is carried on each day link. */
  weekOffset: number;
};

type Props = {
  load: Loadable<WeekRibbonData>;
};

/** Each day cell asks for at least this much width; the strip fits as many
 *  whole cells as clear it. */
const MIN_CELL_REM = 8.5;
/** The gap between cells, matching the `gap: 2` (0.5rem) on the strip. */
const GAP_REM = 0.5;

// A representative week's worth of cells fills the strip before the real
// schedule resolves.
const PLACEHOLDER_DAYS = [0, 1, 2, 3, 4, 5, 6];

/** The dashboard's week picker. Above `md` the caret links step whole weeks and
 *  seven equal-width day cells lay out as a static grid between them. Below `md`
 *  the carets give way to scroll buttons that page a horizontally-scrolling
 *  strip; the strip fits a whole number of equal-width days between the buttons
 *  and opens centered on the selected day. Each cell links the page to that day;
 *  today links back to the un-parameterized dashboard. While loading, the same
 *  strip fills with skeleton cells and the week carets go inert. */
export const WeekRibbon = ({ load }: Props) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dayCount = load.isLoading
    ? PLACEHOLDER_DAYS.length
    : load.value.days.length;

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
        dayCount,
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
  }, [dayCount]);

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
      <WeekCaret direction={-1} load={load} />
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
        {load.isLoading
          ? PLACEHOLDER_DAYS.map((cell) => (
              <WeekCell key={cell} load={{ isLoading: true }} />
            ))
          : load.value.days.map((day) => (
              <WeekCell
                key={day.date}
                load={{
                  isLoading: false,
                  value: {
                    day,
                    selected: day.date === load.value.selectedDate,
                    weekOffset: load.value.weekOffset,
                  },
                }}
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
      <WeekCaret direction={1} load={load} />
    </nav>
  );
};

/** A week-stepping caret: a link to the adjacent week once loaded, an inert
 *  placeholder while loading (the target week is not yet known). */
const WeekCaret = ({
  direction,
  load,
}: {
  direction: -1 | 1;
  load: Loadable<WeekRibbonData>;
}) => {
  const icon = direction === -1 ? <CaretLeftIcon /> : <CaretRightIcon />;
  return load.isLoading ? (
    <span aria-hidden className={weekCaretStyles}>
      {icon}
    </span>
  ) : (
    <Link
      aria-label={direction === -1 ? "Previous week" : "Next week"}
      className={weekCaretStyles}
      href={weekHref(load.value.weekOffset + direction)}
    >
      {icon}
    </Link>
  );
};

type WeekCellData = {
  day: WeekDay;
  selected: boolean;
  weekOffset: number;
};

/** One day cell: the day's label and session name linking to that day once
 *  loaded, a pair of skeleton lines while loading. */
const WeekCell = ({ load }: { load: Loadable<WeekCellData> }) =>
  load.isLoading ? (
    <div className={cellStyles({ dimmed: false, selected: false })}>
      <Skeleton height="0.75rem" width="3rem" />
      <Skeleton height="0.875rem" width="4rem" />
    </div>
  ) : (
    <Link
      aria-current={load.value.selected ? "page" : undefined}
      className={cellStyles({
        dimmed: load.value.day.isPast && !load.value.selected,
        selected: load.value.selected,
      })}
      href={
        load.value.day.isToday
          ? "/"
          : dayHref(load.value.day.date, load.value.weekOffset)
      }
    >
      <span
        className={labelStyles({
          accent: load.value.day.isToday || load.value.selected,
        })}
      >
        {cellLabel(load.value.day)}
      </span>
      <span className={nameStyles({ tone: nameTone(load.value.day) })}>
        {cellName(load.value.day)}
      </span>
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
