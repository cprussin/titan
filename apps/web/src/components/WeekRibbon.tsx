import Link from "next/link";
import { css, cva } from "../../styled-system/css";
import type { WeekDay } from "../server/week-schedule";

type Props = {
  days: readonly WeekDay[];
  /** The day the page below is showing — its cell expands and reads
   *  "· SELECTED" (or "· TODAY" when it is today). */
  selectedDate: string;
};

/** The dashboard's spine: a row of seven day cells. The selected day's cell
 *  widens to carry its summary; the others stay compact, a planned day showing
 *  its primary-movement signature and a logged day its tick. Each cell links the
 *  page to that day (today links back to the un-parameterized dashboard). */
export const WeekRibbon = ({ days, selectedDate }: Props) => (
  <nav aria-label="Training week" className={ribbonStyles}>
    {days.map((day) => (
      <WeekCell day={day} key={day.date} selected={day.date === selectedDate} />
    ))}
  </nav>
);

const WeekCell = ({ day, selected }: { day: WeekDay; selected: boolean }) => {
  const detail = cellDetail(day, selected);
  return (
    <Link
      className={cellStyles({
        dimmed: day.isPast && !selected,
        state: selected ? "expanded" : "collapsed",
      })}
      href={day.isToday ? "/" : `/?date=${day.date}`}
    >
      <span className={labelStyles({ accent: day.isToday || selected })}>
        {cellLabel(day, selected)}
      </span>
      <span className={nameStyles({ expanded: selected, tone: nameTone(day) })}>
        {cellName(day)}
      </span>
      {detail !== undefined && <span className={detailStyles}>{detail}</span>}
    </Link>
  );
};

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

/** The session name, ticked once logged and standing in with "Rest" on an
 *  empty day. */
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

/** The detail line: the expanded cell always shows its summary; a collapsed
 *  planned cell shows its signature; everything else shows nothing. */
const cellDetail = (day: WeekDay, selected: boolean): string | undefined => {
  switch (day.kind) {
    case "rest": {
      return undefined;
    }
    case "planned": {
      return selected ? day.summary : day.signature;
    }
    case "logged": {
      return selected ? day.summary : undefined;
    }
  }
};

// Seven cells share a row. The selected cell grows to twice the others (see
// `cellStyles`), so the row reads as one week with today (or the selection) as
// its focus. Below `md` the row scrolls rather than crushing every cell.
const ribbonStyles = css({
  display: "flex",
  gap: 2,
  md: { overflowX: "visible" },
  overflowX: "auto",
});

// A cell is a link: a compact ledger of one day. Selected cells take an accent
// border and badge fill and grow to `2fr`; the rest sit on the hairline border.
// Past, unselected days recede.
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
    flexBasis: 0,
    flexDirection: "column",
    gap: 1,
    md: { minInlineSize: 0 },
    minInlineSize: "9rem",
    transition:
      "background {durations.fast} {easings.out}, border-color {durations.fast} {easings.out}, opacity {durations.fast} {easings.out}",
  },
  variants: {
    dimmed: {
      false: {},
      true: { opacity: 0.65 },
    },
    state: {
      collapsed: {
        border: "1px solid {colors.border}",
        flexGrow: 1,
        padding: 3,
      },
      expanded: {
        backgroundColor:
          "color-mix(in oklab, {colors.accent} 15%, transparent)",
        border: "1px solid {colors.accent}",
        flexGrow: 2,
        paddingBlock: 3,
        paddingInline: 4,
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
    lineHeight: "condensed",
    minInlineSize: 0,
  },
  variants: {
    expanded: {
      false: { fontSize: "sm", fontWeight: "semibold" },
      true: { fontSize: "lg", fontWeight: "bold" },
    },
    tone: {
      default: { color: "foreground" },
      muted: { color: "muted" },
      success: { color: "success" },
    },
  },
});

const detailStyles = css({
  color: "muted",
  fontFamily: "mono",
  fontSize: "xs",
  fontWeight: "medium",
});
