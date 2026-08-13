"use client";

import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { useState } from "react";
import { css, cva } from "../../styled-system/css";
import { grid } from "../../styled-system/patterns";
import { formatSplitClock, formatWeight } from "../format";
import type { Loadable } from "../loadable";
import type { RowPaceSeries } from "../server/row-pace-series";
import type { StrengthSeries } from "../server/strength-series";
import { Skeleton } from "../ui";
import { BodyWeightTrendCard } from "./BodyWeightTrendCard";
import { Sparkline } from "./Sparkline";

type BodyWeight = {
  latestWeightLb: number | undefined;
  series: readonly number[];
};

export type TrendsBandData = {
  bodyWeight: BodyWeight;
  names: ReadonlyMap<string, string>;
  rowPace: RowPaceSeries | undefined;
  strengthSeries: readonly StrengthSeries[];
};

type Props = {
  load: Loadable<TrendsBandData>;
};

type ColumnSlot = "lead" | "extraA" | "extraB";

/** The dashboard's opening band: up to four global trend columns — the
 *  most-trained lifts' estimated 1RM, rowing pace, and body weight — that never
 *  change with the selected day. On wide screens all four sit in a row; on
 *  phones two show (the lead lift and body weight) and a "Show more" toggle
 *  reveals the rest. Body weight is the weigh-in card, its value the one accent
 *  number. While loading, the same four columns fill with skeletons. */
export const TrendsBand = ({ load }: Props) => {
  const [expanded, setExpanded] = useState(false);
  // Assume extras exist while loading so the toggle holds its place; once loaded
  // it depends on how many series there are.
  const hasExtras = load.isLoading || extrasPresent(load.value);

  return (
    <div>
      <div className={bandStyles}>
        {renderColumn(load, leadColumn, "lead", false)}
        {renderColumn(load, secondColumn, "extraA", !expanded)}
        {renderColumn(load, paceColumn, "extraB", !expanded)}
        <div className={columnStyles({ hidden: false, slot: "bodyWeight" })}>
          {load.isLoading ? (
            <BodyWeightColumnSkeleton />
          ) : (
            <BodyWeightTrendCard
              latestWeightLb={load.value.bodyWeight.latestWeightLb}
              series={load.value.bodyWeight.series}
            />
          )}
        </div>
      </div>
      {hasExtras && (
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

type TrendColumnData = {
  label: string;
  value: string;
  values: readonly number[];
};

/** Render one trend slot: a skeleton column while loading, the resolved column
 *  once loaded, or nothing when the loaded data has no series for that slot. */
const renderColumn = (
  load: Loadable<TrendsBandData>,
  select: (data: TrendsBandData) => TrendColumnData | undefined,
  slot: ColumnSlot,
  hidden: boolean,
) => {
  if (load.isLoading) {
    return (
      <TrendColumn
        hidden={hidden}
        key={slot}
        load={{ isLoading: true }}
        slot={slot}
      />
    );
  }
  const value = select(load.value);
  return value === undefined ? undefined : (
    <TrendColumn
      hidden={hidden}
      key={slot}
      load={{ isLoading: false, value }}
      slot={slot}
    />
  );
};

/** One non-editable trend column: label, latest value, sparkline — each a
 *  skeleton while loading. */
const TrendColumn = ({
  hidden = false,
  load,
  slot,
}: {
  hidden?: boolean;
  load: Loadable<TrendColumnData>;
  slot: ColumnSlot;
}) => (
  <div className={columnStyles({ hidden, slot })}>
    {load.isLoading ? (
      <>
        <Skeleton height="0.875rem" width="7rem" />
        <Skeleton height="1.875rem" radius="md" width="4.5rem" />
        <SparklineSkeleton />
      </>
    ) : (
      <>
        <span className={labelStyles}>{load.value.label}</span>
        <span className={valueStyles}>{load.value.value}</span>
        <Sparkline
          label={`${load.value.label} trend`}
          values={load.value.values}
        />
      </>
    )}
  </div>
);

/** The body-weight column's skeleton: label, accent numeral, sparkline. */
const BodyWeightColumnSkeleton = () => (
  <>
    <Skeleton height="0.875rem" width="6rem" />
    <Skeleton height="1.875rem" radius="md" width="5rem" />
    <SparklineSkeleton />
  </>
);

/** A sparkline-sized skeleton, matching the real trend line's own height so the
 *  column doesn't resize when the data arrives. */
const SparklineSkeleton = () => (
  <div className={sparklineSkeletonStyles}>
    <Skeleton height="100%" radius="md" />
  </div>
);

/** The lead strength lift's column, or nothing when no lift is tracked. */
const leadColumn = (data: TrendsBandData): TrendColumnData | undefined =>
  strengthColumn(data.strengthSeries.at(0), data.names);

/** The second strength lift's column, hidden behind the phone toggle. */
const secondColumn = (data: TrendsBandData): TrendColumnData | undefined =>
  strengthColumn(data.strengthSeries.at(1), data.names);

/** The rowing-pace column, hidden behind the phone toggle. */
const paceColumn = (data: TrendsBandData): TrendColumnData | undefined =>
  data.rowPace === undefined
    ? undefined
    : {
        label: "Row pace · 500m split",
        value: formatSplitClock(data.rowPace.latestSplitSec),
        values: data.rowPace.values,
      };

/** A strength lift's column — its label and latest est-1RM — or nothing. */
const strengthColumn = (
  series: StrengthSeries | undefined,
  names: ReadonlyMap<string, string>,
): TrendColumnData | undefined =>
  series === undefined
    ? undefined
    : {
        label: strengthLabel(series, names),
        value: strengthValue(series),
        values: series.values,
      };

/** Whether the phone-only extra columns (second lift, row pace) exist. */
const extrasPresent = (data: TrendsBandData): boolean =>
  data.strengthSeries.length > 1 || data.rowPace !== undefined;

/** A strength column's label. */
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

// On phones the visible pair (lead lift, body weight) leads, then the extras
// flow below when expanded — so revealing them appends a row rather than
// splitting the pair. `md` order restores the wide layout (lifts, row pace,
// then body weight).
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
      bodyWeight: { md: { order: 3 }, order: 1 },
      extraA: { md: { order: 1 }, order: 2 },
      extraB: { md: { order: 2 }, order: 3 },
      lead: { md: { order: 0 }, order: 0 },
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

// Matches the Sparkline's own height so the column doesn't resize when the real
// trend line renders.
const sparklineSkeletonStyles = css({ blockSize: 16, lg: { blockSize: 28 } });

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
