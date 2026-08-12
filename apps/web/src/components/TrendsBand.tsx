import { css } from "../../styled-system/css";
import { grid, vstack } from "../../styled-system/patterns";
import { formatSplitClock, formatWeight } from "../format";
import type { RowPaceSeries } from "../server/row-pace-series";
import type { StrengthSeries } from "../server/strength-series";
import { BodyWeightTrendCard } from "./BodyWeightTrendCard";
import { Sparkline } from "./Sparkline";

type BodyWeight = {
  lastWeighInLabel: string | undefined;
  latestWeightLb: number | undefined;
  series: readonly number[];
  weighedInToday: boolean;
};

type Props = {
  bodyWeight: BodyWeight;
  names: ReadonlyMap<string, string>;
  rowPace: RowPaceSeries | undefined;
  strengthSeries: readonly StrengthSeries[];
};

/** The dashboard's foot: up to four trend columns — the most-trained lifts'
 *  estimated 1RM, rowing pace, and body weight — each a label over a value over
 *  a sparkline. Body weight is the weigh-in card, its value the page's one
 *  accent number. */
export const TrendsBand = ({
  bodyWeight,
  names,
  rowPace,
  strengthSeries,
}: Props) => (
  <div className={bandStyles}>
    {strengthSeries.map((series) => (
      <TrendColumn
        key={series.exerciseId}
        label={`Est. 1RM · ${names.get(series.exerciseId) ?? series.exerciseId}`}
        value={strengthValue(series)}
        values={series.values}
      />
    ))}
    {rowPace !== undefined && (
      <TrendColumn
        label="Row pace · 500m split"
        value={formatSplitClock(rowPace.latestSplitSec)}
        values={rowPace.values}
      />
    )}
    <BodyWeightTrendCard
      lastWeighInLabel={bodyWeight.lastWeighInLabel}
      latestWeightLb={bodyWeight.latestWeightLb}
      series={bodyWeight.series}
      weighedInToday={bodyWeight.weighedInToday}
    />
  </div>
);

/** One non-editable trend column: label, latest value, sparkline. */
const TrendColumn = ({
  label,
  value,
  values,
}: {
  label: string;
  value: string;
  values: readonly number[];
}) => (
  <div className={columnStyles}>
    <span className={labelStyles}>{label}</span>
    <span className={valueStyles}>{value}</span>
    <Sparkline label={`${label} trend`} values={values} />
  </div>
);

/** A strength series' latest estimated 1RM in its own unit. */
const strengthValue = (series: StrengthSeries): string => {
  const latest = series.values.at(-1);
  return latest === undefined ? "—" : formatWeight(latest, series.unit);
};

// Four columns on wide screens, stacking to a 2×2 grid on phones.
const bandStyles = grid({
  columns: { base: 2, lg: 4 },
  gap: 6,
});

const columnStyles = vstack({ alignItems: "stretch", gap: 2 });

const labelStyles = css({ color: "muted", fontSize: "sm", minInlineSize: 0 });

const valueStyles = css({
  fontFamily: "condensed",
  fontSize: "3xl",
  fontVariantNumeric: "tabular-nums",
  fontWeight: "bold",
  lineHeight: "condensed",
});
