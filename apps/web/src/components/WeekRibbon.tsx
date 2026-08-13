"use client";

import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { z } from "zod";
import { css, cva } from "../../styled-system/css";
import type { Loadable } from "../loadable";
import type { WeekDay } from "../server/week-day";
import { weekDaySchema } from "../server/week-day";
import { Skeleton } from "../ui";
import type { PageDirection } from "./week-ribbon-window";
import {
  bufferedOffsetRange,
  dayDiff,
  initialLeftOffset,
  pageLeftOffset,
  swipeDirection,
  visibleDayCount,
} from "./week-ribbon-window";

export type WeekRibbonData = {
  days: readonly WeekDay[];
  /** The athlete's local calendar today, so the strip can measure every day's
   *  offset from it and open centred on it. */
  today: string;
  /** The day the page below is showing — its cell takes the accent border and
   *  `aria-current`, and reads "· TODAY" when it is also today. */
  selectedDate: string;
  /** Which week the page rendered: 0 is the current week, ±1 the adjacent ones.
   *  Seeds the strip's loaded range and is carried on that week's day links. */
  weekOffset: number;
};

const weekResponseSchema = z.object({ days: z.array(weekDaySchema) });

/** Fetch one week of ribbon cells at a given offset from the current week.
 *  Parsed at the boundary (DATA.md); throws on a failed load so the caller
 *  surfaces it rather than showing a silently empty week. */
export const fetchWeek = async (
  weekOffset: number,
): Promise<readonly WeekDay[]> => {
  const response = await fetch(`/api/week?offset=${weekOffset}`);
  if (!response.ok) {
    throw new Error(`week load failed with status ${response.status}`);
  }
  return weekResponseSchema.parse(await response.json()).days;
};

/** A week of cells the strip has loaded, tagged with its offset from the current
 *  week so each cell links back with the right `?week`. */
type LoadedWeek = {
  days: readonly WeekDay[];
  offset: number;
};

/** One loaded day paired with the week it came from, for its link. */
type Cell = {
  day: WeekDay;
  weekOffset: number;
};

type Props = {
  load: Loadable<WeekRibbonData>;
  /** Fetches an adjacent week; injected in tests. */
  loadWeek?: typeof fetchWeek;
  /** Measures how many day cells fit; injected in tests. */
  measureVisibleDays?: typeof defaultMeasureVisibleDays;
};

/** Each day cell asks for at least this much width; the strip fits as many
 *  whole cells as clear it. */
const MIN_CELL_REM = 8.5;
/** The gap between cells, matching the `gap: 2` (0.5rem) on the strip. */
const GAP_REM = 0.5;
/** A horizontal drag shorter than this (in px) is a tap, not a swipe. */
const SWIPE_THRESHOLD_PX = 40;

// A representative week's worth of cells fills the strip before the real
// schedule resolves.
const PLACEHOLDER_DAYS = [0, 1, 2, 3, 4, 5, 6];

/** The document's root font size in pixels, used to turn the strip's rem-based
 *  metrics into the pixels its layout math needs. Falls back to the CSS initial
 *  16px when the computed value is unreadable. */
const rootFontSizePx = (): number => {
  const parsed = Number.parseFloat(
    getComputedStyle(document.documentElement).fontSize,
  );
  return Number.isNaN(parsed) ? 16 : parsed;
};

/** How many whole day cells fit between the arrows at the current width. */
const defaultMeasureVisibleDays = ({
  dayCount,
  viewport,
}: {
  dayCount: number;
  viewport: HTMLElement;
}): number => {
  const rootFontSize = rootFontSizePx();
  return visibleDayCount({
    containerWidth: viewport.clientWidth,
    dayCount,
    gap: GAP_REM * rootFontSize,
    minCellWidth: MIN_CELL_REM * rootFontSize,
  });
};

/** The dashboard's day picker: a left arrow, a whole number of equal-width day
 *  cells that grow to fill the width, and a right arrow. The arrow buttons and
 *  horizontal swipes page the strip by exactly the visible-day count, sliding a
 *  fresh, non-overlapping set into view; they never change the selected day. The
 *  flanking pages are prefetched so a page turns instantly, and the strip opens
 *  centred on today. Each cell links the page to that day; today links back to
 *  the un-parameterized dashboard. While loading, the same strip fills with
 *  skeleton cells. */
export const WeekRibbon = ({
  load,
  loadWeek = fetchWeek,
  measureVisibleDays = defaultMeasureVisibleDays,
}: Props) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const swipeStartRef = useRef<number | undefined>(undefined);
  const hasCenteredRef = useRef(false);

  const [weeks, setWeeks] = useState<readonly LoadedWeek[]>(() =>
    load.isLoading
      ? []
      : [{ days: load.value.days, offset: load.value.weekOffset }],
  );
  const [visibleDays, setVisibleDays] = useState(1);
  const [leftOffset, setLeftOffset] = useState(0);
  // Whether the next transform change slides (a user page) or snaps (opening,
  // resizing, or a lazily loaded week shifting the strip's origin).
  const [animate, setAnimate] = useState(false);

  // The strip's outer week offsets and the loads in flight — a ref so the load
  // effect reads the latest bounds without re-subscribing.
  const boundsRef = useRef({
    max: load.isLoading ? 0 : load.value.weekOffset,
    min: load.isLoading ? 0 : load.value.weekOffset,
    pending: new Set<number>(),
  });

  const today = load.isLoading ? undefined : load.value.today;
  const selectedDate = load.isLoading ? undefined : load.value.selectedDate;
  const cells: readonly Cell[] = load.isLoading
    ? []
    : weeks.flatMap((week) =>
        week.days.map((day) => ({ day, weekOffset: week.offset })),
      );

  // Every loaded day sits at `today`-offset `minLoadedOffset + its index`, so the
  // leftmost visible day's offset maps straight to a cell index — the strip's
  // transform position. A lazily prepended week lowers `minLoadedOffset`, which
  // is why such a load snaps rather than slides. Both are 0 until a week is
  // loaded (the skeleton state), which is a real position, not a masked failure.
  const firstDate = cells[0]?.day.date;
  const lastDate = cells.at(-1)?.day.date;
  const minLoadedOffset =
    today === undefined || firstDate === undefined
      ? 0
      : dayDiff(today, firstDate);
  const maxLoadedOffset =
    today === undefined || lastDate === undefined
      ? 0
      : dayDiff(today, lastDate);
  const leftIndex = leftOffset - minLoadedOffset;

  const dayCountRef = useRef(cells.length);
  useEffect(() => {
    dayCountRef.current =
      cells.length === 0 ? PLACEHOLDER_DAYS.length : cells.length;
  }, [cells.length]);

  const measure = useCallback((): number | undefined => {
    const viewport = viewportRef.current;
    return viewport === null
      ? undefined
      : measureVisibleDays({ dayCount: dayCountRef.current, viewport });
  }, [measureVisibleDays]);

  // Fit a whole number of days before paint, and open centred on today once. The
  // centring runs a single time (guarded), so re-measuring on resize never yanks
  // the window back to today.
  useLayoutEffect(() => {
    const measured = measure();
    if (measured !== undefined) {
      setVisibleDays(measured);
      if (!hasCenteredRef.current) {
        hasCenteredRef.current = true;
        setLeftOffset(initialLeftOffset(measured));
      }
    }
  }, [measure]);

  // A real resize re-fits the strip; it snaps (no slide) and keeps the window
  // where it is rather than re-centring.
  useEffect(() => {
    const onResize = () => {
      const measured = measure();
      if (measured !== undefined) {
        setAnimate(false);
        setVisibleDays(measured);
      }
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [measure]);

  // Drive the transform from the current index and fit. Setting the custom
  // properties here (rather than inline) keeps the slide vs. snap decision on the
  // `data-animate` attribute, which the commit has already written by now.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (track !== null) {
      track.style.setProperty("--left-index", String(leftIndex));
      track.style.setProperty("--visible-days", String(visibleDays));
    }
  }, [leftIndex, visibleDays]);

  const loadEarlier = useCallback(() => {
    const target = boundsRef.current.min - 1;
    if (!boundsRef.current.pending.has(target)) {
      boundsRef.current.pending.add(target);
      loadWeek(target)
        .then((days) => {
          boundsRef.current.pending.delete(target);
          boundsRef.current.min = target;
          // A prepend shifts every index right; snap so the day at the left edge
          // stays put instead of sliding.
          setAnimate(false);
          setWeeks((prev) => [{ days, offset: target }, ...prev]);
        })
        .catch((error: unknown) => {
          boundsRef.current.pending.delete(target);
          // biome-ignore lint/suspicious/noConsole: surface a failed week load
          console.error("Failed to load earlier week", error);
        });
    }
  }, [loadWeek]);

  const loadLater = useCallback(() => {
    const target = boundsRef.current.max + 1;
    if (!boundsRef.current.pending.has(target)) {
      boundsRef.current.pending.add(target);
      loadWeek(target)
        .then((days) => {
          boundsRef.current.pending.delete(target);
          boundsRef.current.max = target;
          setWeeks((prev) => [...prev, { days, offset: target }]);
        })
        .catch((error: unknown) => {
          boundsRef.current.pending.delete(target);
          // biome-ignore lint/suspicious/noConsole: surface a failed week load
          console.error("Failed to load later week", error);
        });
    }
  }, [loadWeek]);

  // Keep the prior and next pages loaded around the window, extending a week at a
  // time until the buffer is covered, so a page turn lands on ready cells.
  useEffect(() => {
    if (!load.isLoading) {
      const range = bufferedOffsetRange(leftOffset, visibleDays);
      if (range.min < minLoadedOffset) {
        loadEarlier();
      }
      if (range.max > maxLoadedOffset) {
        loadLater();
      }
    }
  }, [
    load.isLoading,
    leftOffset,
    visibleDays,
    minLoadedOffset,
    maxLoadedOffset,
    loadEarlier,
    loadLater,
  ]);

  // Page by exactly the visible-day count, sliding a fresh set into view.
  const page = (direction: PageDirection) => {
    setAnimate(true);
    setLeftOffset((current) => pageLeftOffset(current, visibleDays, direction));
  };

  return (
    <nav aria-label="Training week" className={pickerStyles}>
      <button
        aria-label="Show earlier days"
        className={arrowStyles}
        onClick={() => {
          page("earlier");
        }}
        type="button"
      >
        <CaretLeftIcon />
      </button>
      <div
        className={viewportStyles}
        data-strip-viewport=""
        onPointerDown={(event) => {
          swipeStartRef.current = event.clientX;
        }}
        onPointerUp={(event) => {
          const start = swipeStartRef.current;
          swipeStartRef.current = undefined;
          if (start !== undefined) {
            const direction = swipeDirection(
              event.clientX - start,
              SWIPE_THRESHOLD_PX,
            );
            if (direction !== "none") {
              page(direction);
            }
          }
        }}
        ref={viewportRef}
      >
        <div
          className={trackStyles}
          data-animate={animate ? "true" : "false"}
          data-strip-track=""
          ref={trackRef}
        >
          {load.isLoading
            ? PLACEHOLDER_DAYS.map((cell) => <SkeletonCell key={cell} />)
            : cells.map((cell) => (
                <WeekCell
                  cell={cell}
                  key={`${cell.weekOffset}:${cell.day.date}`}
                  selected={cell.day.date === selectedDate}
                />
              ))}
        </div>
      </div>
      <button
        aria-label="Show later days"
        className={arrowStyles}
        onClick={() => {
          page("later");
        }}
        type="button"
      >
        <CaretRightIcon />
      </button>
    </nav>
  );
};

/** One day cell: the day's label and session name linking to that day. */
const WeekCell = ({ cell, selected }: { cell: Cell; selected: boolean }) => {
  const { day } = cell;
  return (
    <Link
      aria-current={selected ? "page" : undefined}
      className={cellStyles({ dimmed: day.isPast && !selected, selected })}
      href={day.isToday ? "/" : dayHref(day.date, cell.weekOffset)}
    >
      <span className={labelStyles({ accent: day.isToday || selected })}>
        {cellLabel(day)}
      </span>
      <span className={nameStyles({ tone: nameTone(day) })}>
        {cellName(day)}
      </span>
    </Link>
  );
};

/** A placeholder cell: a pair of skeleton lines standing in for a day's label
 *  and session name until the schedule resolves. */
const SkeletonCell = () => (
  <div className={cellStyles({ dimmed: false, selected: false })}>
    <Skeleton height="0.75rem" width="3rem" />
    <Skeleton height="0.875rem" width="4rem" />
  </div>
);

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

// The square-arrow buttons that page the strip left and right.
const arrowStyles = css({
  _hoverEnabled: { borderColor: "muted", color: "foreground" },
  alignItems: "center",
  appearance: "none",
  backgroundColor: "transparent",
  border: "1px solid {colors.border}",
  borderRadius: "md",
  color: "muted",
  cursor: "pointer",
  display: "flex",
  flexShrink: 0,
  fontFamily: "inherit",
  inlineSize: 8,
  justifyContent: "center",
  transition:
    "color {durations.fast} {easings.out}, border-color {durations.fast} {easings.out}",
});

// The window between the arrows: exactly the visible days show; the rest of the
// track is clipped, and the strip is paged by transform rather than scrolled.
// `touch-action: pan-y` leaves vertical page scrolling to the browser while the
// horizontal drag is handled as a swipe.
const viewportStyles = css({
  flex: 1,
  overflow: "hidden",
  position: "relative",
  touchAction: "pan-y",
});

// The sliding track. `--left-index` (the leftmost visible cell) and
// `--visible-days` (the fit) are set on it at commit time; the transform places
// the indexed cell flush at the start. It slides only when `data-animate` is on
// — user paging — and snaps otherwise.
const trackStyles = css({
  "&[data-animate='true']": {
    transition: "transform {durations.normal} {easings.out}",
  },
  display: "flex",
  gap: 2,
  transform:
    "translateX(calc(var(--left-index, 0) * (100% + {spacing.2}) / var(--visible-days, 1) * -1))",
  willChange: "transform",
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
    // set by the fit effect).
    flexBasis:
      "calc((100% - (var(--visible-days, 1) - 1) * {spacing.2}) / var(--visible-days, 1))",
    flexDirection: "column",
    flexGrow: 0,
    flexShrink: 0,
    gap: 1,
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
