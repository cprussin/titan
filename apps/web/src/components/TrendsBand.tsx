"use client";

import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { useState } from "react";
import { css, cva } from "../../styled-system/css";
import { grid } from "../../styled-system/patterns";
import { formatSplitClock, formatWeight } from "../format";
import type { RowPaceSeries } from "../server/row-pace-series";
import type { StrengthSeries } from "../server/strength-series";
import { BodyWeightTrendCard } from "./BodyWeightTrendCard";
import { Sparkline } from "./Sparkline";

type BodyWeight = {
  latestWeightLb: number | undefined;
  series: readonly number[];
};

type Props = {
  bodyWeight: BodyWeight;
  names: ReadonlyMap<string, string>;
  rowPace: RowPaceSeries | undefined;
  strengthSeries: readonly StrengthSeries[];
};

/** The dashboard's opening band: up to four global trend columns — the
 *  most-trained lifts' estimated 1RM, rowing pace, and body weight — that never
 *  change with the selected day. On wide screens all four sit in a row; on
 *  phones two show (the lead lift and body weight) and a "Show more" toggle
 *  reveals the rest. Body weight is the weigh-in card, its value the one accent
 *  number. */
export const TrendsBand = ({
  bodyWeight,
  names,
  rowPace,
  strengthSeries,
}: Props) => {
  const [expanded, setExpanded] = useState(false);
  const lead = strengthSeries.at(0);
  const secondLift = strengthSeries.at(1);
  // The lead lift and body weight are the phone's always-visible pair; the
  // second lift and row pace collapse behind the toggle.
  const extras = [secondLift, rowPace].filter((entry) => entry !== undefined);

  return (
    <div>
      <div className={bandStyles}>
        {lead !== undefined && (
          <TrendColumn
            label={strengthLabel(lead, names)}
            slot="lead"
            value={strengthValue(lead)}
            values={lead.values}
          />
        )}
        {secondLift !== undefined && (
          <TrendColumn
            hidden={!expanded}
            label={strengthLabel(secondLift, names)}
            slot="extraA"
            value={strengthValue(secondLift)}
            values={secondLift.values}
          />
        )}
        {rowPace !== undefined && (
          <TrendColumn
            hidden={!expanded}
            label="Row pace · 500m split"
            slot="extraB"
            value={formatSplitClock(rowPace.latestSplitSec)}
            values={rowPace.values}
          />
        )}
        <div className={columnStyles({ hidden: false, slot: "bodyWeight" })}>
          <BodyWeightTrendCard
            latestWeightLb={bodyWeight.latestWeightLb}
            series={bodyWeight.series}
          />
        </div>
      </div>
      {extras.length > 0 && (
        <button
          className={toggleStyles}
          onClick={() => setExpanded((value) => !value)}
          type="button"
        >
          {expanded ? "Show less" : "Show more"}
          <CaretDownIcon className={caretStyles({ expanded })} size={12} />
        </button>
      )}
    </div>
  );
};

/** One non-editable trend column: label, latest value, sparkline. */
const TrendColumn = ({
  hidden = false,
  label,
  slot,
  value,
  values,
}: {
  hidden?: boolean;
  label: string;
  slot: "lead" | "extraA" | "extraB";
  value: string;
  values: readonly number[];
}) => (
  <div className={columnStyles({ hidden, slot })}>
    <span className={labelStyles}>{label}</span>
    <span className={valueStyles}>{value}</span>
    <Sparkline label={`${label} trend`} values={values} />
  </div>
);

/** A strength column's label and latest est-1RM. */
const strengthLabel = (
  series: StrengthSeries,
  names: ReadonlyMap<string, string>,
): string => `Est. 1RM · ${names.get(series.exerciseId) ?? series.exerciseId}`;

const strengthValue = (series: StrengthSeries): string => {
  const latest = series.values.at(-1);
  return latest === undefined ? "—" : formatWeight(latest, series.unit);
};

// Two columns on phones (the lead lift and body weight in the first row), four
// across from `md`.
const bandStyles = grid({ columns: { base: 2, md: 4 }, gap: 6 });

// Body weight sits second in the DOM so it lands in the phone's always-visible
// row; `md` order restores the wide layout (lifts, row pace, then body weight).
const columnStyles = cva({
  base: {
    alignItems: "stretch",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  variants: {
    hidden: {
      false: {},
      // Collapsed on phones, always shown from `md`.
      true: { display: "none", md: { display: "flex" } },
    },
    slot: {
      bodyWeight: { md: { order: 3 } },
      extraA: { md: { order: 1 } },
      extraB: { md: { order: 2 } },
      lead: { md: { order: 0 } },
    },
  },
});

const labelStyles = css({ color: "muted", fontSize: "sm", minInlineSize: 0 });

const valueStyles = css({
  fontFamily: "condensed",
  fontSize: "3xl",
  fontVariantNumeric: "tabular-nums",
  fontWeight: "bold",
  lineHeight: "condensed",
});

// The show-more control only matters on phones, where the extra trends collapse.
const toggleStyles = css({
  _hoverEnabled: { color: "foreground" },
  alignItems: "center",
  background: "none",
  border: "none",
  color: "muted",
  cursor: "pointer",
  display: "flex",
  fontSize: "xs",
  fontWeight: "bold",
  gap: 1.5,
  letterSpacing: "wide",
  marginBlockStart: 3,
  md: { display: "none" },
  minBlockSize: 11,
  textTransform: "uppercase",
});

const caretStyles = cva({
  base: { transition: "transform {durations.fast} {easings.out}" },
  variants: {
    expanded: {
      false: {},
      true: { transform: "rotate(180deg)" },
    },
  },
});
