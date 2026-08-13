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
import {
  centeredScrollLeft,
  scrollLeftAfterPrepend,
  visibleDayCount,
} from "./week-ribbon-scroll";

export type WeekRibbonData = {
  days: readonly WeekDay[];
  /** The day the page below is showing — its cell takes the accent border and
   *  `aria-current`, and reads "· TODAY" when it is also today. */
  selectedDate: string;
  /** Which week the page rendered: 0 is the current week, ±1 the adjacent ones.
   *  Anchors the strip and is carried on each of its day links. */
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

/** Observe the strip's leading and trailing sentinels, calling back when either
 *  scrolls into view. Injected in tests; defaults to an `IntersectionObserver`
 *  rooted on the viewport, pre-loading a little before the edge is reached. */
export type EdgeObserver = (args: {
  earlier: Element;
  later: Element;
  onEarlier: () => void;
  onLater: () => void;
  root: Element;
}) => () => void;

const observeEdgesWithIntersectionObserver: EdgeObserver = ({
  earlier,
  later,
  onEarlier,
  onLater,
  root,
}) => {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          switch (entry.target) {
            case earlier: {
              onEarlier();
              break;
            }
            case later: {
              onLater();
              break;
            }
            default: {
              break;
            }
          }
        }
      }
    },
    { root, rootMargin: "0px 200px" },
  );
  observer.observe(earlier);
  observer.observe(later);
  return () => {
    observer.disconnect();
  };
};

/** A week of cells the strip is showing, tagged with its offset from the current
 *  week so each cell links back with the right `?week`. */
type LoadedWeek = {
  days: readonly WeekDay[];
  offset: number;
};

type Props = {
  load: Loadable<WeekRibbonData>;
  /** Fetches an adjacent week; injected in tests. */
  loadWeek?: typeof fetchWeek;
  /** Watches the strip edges; injected in tests. */
  observeEdges?: EdgeObserver;
};

/** Each day cell asks for at least this much width; the strip fits as many
 *  whole cells as clear it. */
const MIN_CELL_REM = 8.5;
/** The gap between cells, matching the `gap: 2` (0.5rem) on the strip. */
const GAP_REM = 0.5;

// A representative week's worth of cells fills the strip before the real
// schedule resolves.
const PLACEHOLDER_DAYS = [0, 1, 2, 3, 4, 5, 6];

/** The dashboard's week picker: one horizontally-scrolling strip of equal-width
 *  day cells that fits a whole number of days between two scroll buttons. The
 *  buttons only slide the strip — they never change the selected day — and the
 *  strip lazy-loads the neighbouring weeks as either end nears view, so it
 *  scrolls across weeks without bound. Each cell links the page to that day;
 *  today links back to the un-parameterized dashboard. While loading, the same
 *  strip fills with skeleton cells. */
export const WeekRibbon = ({
  load,
  loadWeek = fetchWeek,
  observeEdges = observeEdgesWithIntersectionObserver,
}: Props) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const earlierSentinelRef = useRef<HTMLDivElement | null>(null);
  const laterSentinelRef = useRef<HTMLDivElement | null>(null);

  const [weeks, setWeeks] = useState<readonly LoadedWeek[]>(() =>
    load.isLoading
      ? []
      : [{ days: load.value.days, offset: load.value.weekOffset }],
  );

  // The strip's outer offsets and the loads in flight — kept in a ref so the
  // edge callbacks read the latest bounds without re-subscribing the observer.
  const boundsRef = useRef({
    max: load.isLoading ? 0 : load.value.weekOffset,
    min: load.isLoading ? 0 : load.value.weekOffset,
    pending: new Set<number>(),
  });
  // The strip metrics captured just before a prepend; set alongside the new
  // week so the layout effect can hold the view still once it commits.
  const [pendingPrepend, setPendingPrepend] = useState<
    { oldScrollLeft: number; oldScrollWidth: number } | undefined
  >(undefined);

  const totalDays = weeks.reduce(
    (count, entry) => count + entry.days.length,
    0,
  );
  const dayCount = load.isLoading ? PLACEHOLDER_DAYS.length : totalDays;

  // Fit a whole number of equal-width days between the scroll buttons, re-fitting
  // on resize by publishing the count as `--visible-days` for the cells to divide
  // the strip by.
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

  // Once the prepended week has committed, shift the scroll by the width it
  // added so the cells the user was looking at stay exactly where they were.
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (pendingPrepend === undefined || viewport === null) {
      return;
    }
    viewport.scrollLeft = scrollLeftAfterPrepend({
      newScrollWidth: viewport.scrollWidth,
      oldScrollWidth: pendingPrepend.oldScrollWidth,
      scrollLeft: pendingPrepend.oldScrollLeft,
    });
    setPendingPrepend(undefined);
  }, [pendingPrepend]);

  const loadEarlier = useCallback(() => {
    const viewport = viewportRef.current;
    const target = boundsRef.current.min - 1;
    if (viewport === null || boundsRef.current.pending.has(target)) {
      return;
    }
    boundsRef.current.pending.add(target);
    loadWeek(target)
      .then((loaded) => {
        boundsRef.current.pending.delete(target);
        boundsRef.current.min = target;
        setPendingPrepend({
          oldScrollLeft: viewport.scrollLeft,
          oldScrollWidth: viewport.scrollWidth,
        });
        setWeeks((prev) => [{ days: loaded, offset: target }, ...prev]);
      })
      .catch((error: unknown) => {
        boundsRef.current.pending.delete(target);
        // biome-ignore lint/suspicious/noConsole: surface a failed week load
        console.error("Failed to load earlier week", error);
      });
  }, [loadWeek]);

  const loadLater = useCallback(() => {
    const target = boundsRef.current.max + 1;
    if (boundsRef.current.pending.has(target)) {
      return;
    }
    boundsRef.current.pending.add(target);
    loadWeek(target)
      .then((loaded) => {
        boundsRef.current.pending.delete(target);
        boundsRef.current.max = target;
        setWeeks((prev) => [...prev, { days: loaded, offset: target }]);
      })
      .catch((error: unknown) => {
        boundsRef.current.pending.delete(target);
        // biome-ignore lint/suspicious/noConsole: surface a failed week load
        console.error("Failed to load later week", error);
      });
  }, [loadWeek]);

  // Watch the strip's ends; the sentinels only render once loaded, so while
  // loading the refs are null and this stays inert.
  useEffect(() => {
    const viewport = viewportRef.current;
    const earlier = earlierSentinelRef.current;
    const later = laterSentinelRef.current;
    if (viewport === null || earlier === null || later === null) {
      return;
    }
    return observeEdges({
      earlier,
      later,
      onEarlier: loadEarlier,
      onLater: loadLater,
      root: viewport,
    });
  }, [loadEarlier, loadLater, observeEdges]);

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
      <button
        aria-label="Scroll to earlier days"
        className={arrowStyles}
        onClick={() => {
          scrollByPage(-1);
        }}
        type="button"
      >
        <CaretLeftIcon />
      </button>
      <div className={cellsStyles} ref={viewportRef}>
        {load.isLoading ? (
          PLACEHOLDER_DAYS.map((cell) => <SkeletonCell key={cell} />)
        ) : (
          <>
            <div
              aria-hidden
              className={sentinelStyles}
              ref={earlierSentinelRef}
            />
            {weeks.map((entry) =>
              entry.days.map((day) => (
                <WeekCell
                  day={day}
                  key={`${entry.offset}:${day.date}`}
                  selected={day.date === load.value.selectedDate}
                  weekOffset={entry.offset}
                />
              )),
            )}
            <div
              aria-hidden
              className={sentinelStyles}
              ref={laterSentinelRef}
            />
          </>
        )}
      </div>
      <button
        aria-label="Scroll to later days"
        className={arrowStyles}
        onClick={() => {
          scrollByPage(1);
        }}
        type="button"
      >
        <CaretRightIcon />
      </button>
    </nav>
  );
};

/** One day cell: the day's label and session name linking to that day. */
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

// The square-arrow scroll buttons that page the strip left and right, standing
// in for the scrollbar the strip hides.
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

// A horizontally-scrolling strip; the scroll buttons drive it so its scrollbar
// is hidden. `scroll-behavior: smooth` makes the buttons slide it.
const cellsStyles = css({
  "&::-webkit-scrollbar": { display: "none" },
  display: "flex",
  flex: 1,
  gap: 2,
  overflowX: "auto",
  position: "relative",
  scrollBehavior: "smooth",
  scrollbarWidth: "none",
});

// Zero-width markers at the strip's ends; when one scrolls into view the strip
// loads the week beyond it.
const sentinelStyles = css({
  flexShrink: 0,
  inlineSize: "0.0625rem",
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
