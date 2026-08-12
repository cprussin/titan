import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import Link from "next/link";
import { css, cva } from "../../styled-system/css";
import type { WeekDay } from "../server/week-schedule";

type Props = {
  days: readonly WeekDay[];
  /** The day the page below is showing — its cell reads "· SELECTED" (or "·
   *  TODAY" when it is today) and takes the accent border. */
  selectedDate: string;
  /** Which week is shown: 0 is the current week, ±1 the adjacent ones. Drives
   *  the caret links and is carried on each day link. */
  weekOffset: number;
};

/** The dashboard's week picker: caret buttons step whole weeks, and seven
 *  equal-width day cells sit between them (they never change width on
 *  selection). Each cell links the page to that day; today links back to the
 *  un-parameterized dashboard. Below `md` the carets give way to a scrollable
 *  strip. */
export const WeekRibbon = ({ days, selectedDate, weekOffset }: Props) => (
  <nav aria-label="Training week" className={pickerStyles}>
    <Link
      aria-label="Previous week"
      className={caretStyles}
      href={weekHref(weekOffset - 1)}
    >
      <CaretLeftIcon />
    </Link>
    <div className={cellsStyles}>
      {days.map((day) => (
        <WeekCell
          day={day}
          key={day.date}
          selected={day.date === selectedDate}
          weekOffset={weekOffset}
        />
      ))}
    </div>
    <Link
      aria-label="Next week"
      className={caretStyles}
      href={weekHref(weekOffset + 1)}
    >
      <CaretRightIcon />
    </Link>
  </nav>
);

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
    className={cellStyles({
      dimmed: day.isPast && !selected,
      selected,
    })}
    href={day.isToday ? "/" : dayHref(day.date, weekOffset)}
  >
    <span className={labelStyles({ accent: day.isToday || selected })}>
      {cellLabel(day, selected)}
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

/** The micro-label, suffixed with the day's standing — today wins over a plain
 *  selection so today always reads "· TODAY". */
const cellLabel = (day: WeekDay, selected: boolean): string =>
  `${day.label}${labelSuffix(day, selected)}`;

const labelSuffix = (day: WeekDay, selected: boolean): string => {
  if (day.isToday) {
    return " · TODAY";
  } else {
    return selected ? " · SELECTED" : "";
  }
};

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

// The carets flank the cells and stretch to their height. Below `md` they are
// hidden and the cells scroll instead.
const pickerStyles = css({
  alignItems: "stretch",
  display: "flex",
  gap: 2,
});

const caretStyles = css({
  _hoverEnabled: { borderColor: "muted", color: "foreground" },
  alignItems: "center",
  border: "1px solid {colors.border}",
  borderRadius: "md",
  color: "muted",
  display: { base: "none", md: "flex" },
  flexShrink: 0,
  inlineSize: 8,
  justifyContent: "center",
  transition:
    "color {durations.fast} {easings.out}, border-color {durations.fast} {easings.out}",
});

// Seven equal columns from `md` up; a scrollable strip below it.
const cellsStyles = css({
  display: "flex",
  flex: 1,
  gap: 2,
  md: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    overflowX: "visible",
  },
  overflowX: "auto",
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
    flex: { base: "0 0 auto", md: "1" },
    flexDirection: "column",
    gap: 1,
    md: { minInlineSize: 0 },
    minInlineSize: "8.5rem",
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
