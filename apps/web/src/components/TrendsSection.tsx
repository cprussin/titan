import type { BodyMetric } from "@titan/domain/body-metric";
import { css } from "../../styled-system/css";
import { grid, hstack, vstack } from "../../styled-system/patterns";
import { formatDistance, formatWeight } from "../format";
import type { TrendsSummary } from "../server/trends-summary";
import { Card } from "../ui";
import { LogWeightButton } from "./LogWeightButton";
import { Sparkline } from "./Sparkline";
import { StatTile } from "./StatTile";
import { WeighInHistoryButton } from "./WeighInHistoryButton";

type Props = {
  metrics: readonly BodyMetric[];
  names: Map<string, string>;
  summary: TrendsSummary;
};

/** The dashboard's trends card: headline training volume as a stat row, then
 *  the strength (est. 1RM) and body-weight trend lines. Weigh-in logging and
 *  history open from buttons clustered with the body-weight chart. Content
 *  stays flat inside the card — no nested boxes. */
export const TrendsSection = ({ metrics, names, summary }: Props) => (
  <Card title="Trends">
    <div className={statGridStyles}>
      <StatTile label="Total sets" value={`${summary.totalSets}`} />
      <StatTile label="Rowing" value={formatDistance(summary.rowingMeters)} />
      <StatTile
        hint={weightChangeHint(summary.weightChangeLb)}
        label="Body weight"
        tone="accent"
        value={
          summary.latestWeightLb === undefined
            ? "—"
            : formatWeight(summary.latestWeightLb)
        }
      />
    </div>

    <div className={chartsStyles}>
      <div className={chartStyles}>
        <div className={chartHeaderStyles}>
          <h3 className={chartTitleStyles}>{strengthTitle(summary, names)}</h3>
          {latestStrength(summary) !== undefined && (
            <span className={chartValueStyles}>{latestStrength(summary)}</span>
          )}
        </div>
        <Sparkline
          label="Estimated 1RM trend"
          values={summary.strength?.values ?? []}
        />
      </div>

      <div className={chartStyles}>
        <div className={chartHeaderStyles}>
          <h3 className={chartTitleStyles}>Body weight</h3>
          <div className={chartActionsStyles}>
            <LogWeightButton />
            <WeighInHistoryButton metrics={metrics} />
          </div>
        </div>
        <Sparkline label="Body weight trend" values={summary.weightSeries} />
      </div>
    </div>
  </Card>
);

/** The strength chart's heading: the estimated-1RM label, named with the
 *  most-trained lift once one exists. */
const strengthTitle = (
  summary: TrendsSummary,
  names: Map<string, string>,
): string =>
  summary.strength === undefined
    ? "Strength · est. 1RM"
    : `Strength · est. 1RM · ${names.get(summary.strength.exerciseId) ?? summary.strength.exerciseId}`;

/** The latest estimated 1RM, formatted in the lift's own unit, or `undefined`
 *  before any weighted work is logged. */
const latestStrength = (summary: TrendsSummary): string | undefined => {
  const latest = summary.strength?.values.at(-1);
  return latest === undefined
    ? undefined
    : formatWeight(latest, summary.strength?.unit);
};

/** The change-since-last-weigh-in caption for the body-weight stat, or
 *  `undefined` when there's nothing to compare against. */
const weightChangeHint = (changeLb: number | undefined): string | undefined =>
  changeLb === undefined || changeLb === 0
    ? undefined
    : `${changeLb > 0 ? "▲" : "▼"} ${formatWeight(Math.abs(changeLb))}`;

const statGridStyles = grid({ columns: 3, gap: 4, lg: { gap: 8 } });

// A hairline rule separates the headline stat row from the trend charts below.
const chartsStyles = grid({
  alignItems: "start",
  borderBlockStart: "1px solid {colors.border}",
  gap: 6,
  gridTemplateColumns: { base: "1fr", md: "repeat(2, minmax(0, 1fr))" },
  lg: { gap: 10 },
  paddingBlockStart: 5,
});

const chartStyles = vstack({ alignItems: "stretch", gap: 3 });

// The chart's title and its trailing slot (a value caption or the log/history
// buttons) share a row.
const chartHeaderStyles = hstack({
  gap: 3,
  justifyContent: "space-between",
  minBlockSize: 8,
});

const chartTitleStyles = css({
  color: "muted",
  fontSize: "sm",
  fontWeight: "semibold",
  minInlineSize: 0,
});

const chartValueStyles = css({
  flexShrink: 0,
  fontSize: "sm",
  fontVariantNumeric: "tabular-nums",
  fontWeight: "semibold",
});

const chartActionsStyles = hstack({ flexShrink: 0, gap: 2 });
