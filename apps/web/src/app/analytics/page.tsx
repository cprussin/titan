import { ChartLineIcon } from "@phosphor-icons/react/dist/ssr/ChartLine";
import { listBodyMetrics } from "@titan/db/body-metrics";
import { listExternalWorkouts } from "@titan/db/external-workouts";
import { listWorkoutSessions } from "@titan/db/workout-sessions";
import { css } from "../../../styled-system/css";
import { grid, hstack, vstack } from "../../../styled-system/patterns";
import { requireAuth } from "../../auth/session";
import { BodyWeightForm } from "../../components/BodyWeightForm";
import { DeleteEntryButton } from "../../components/DeleteEntryButton";
import { Sparkline } from "../../components/Sparkline";
import { StatTile } from "../../components/StatTile";
import { TopBar } from "../../components/TopBar";
import { db } from "../../db";
import { formatDistance, formatWeight } from "../../format";
import { exerciseNames } from "../../server/exercise-names";
import { topStrengthSeries } from "../../server/strength-series";
import { USER_ID } from "../../user";

const AnalyticsPage = async () => {
  await requireAuth();
  const [metrics, sessions, externals, names] = await Promise.all([
    listBodyMetrics(db, USER_ID, 60),
    listWorkoutSessions(db, USER_ID, 100),
    listExternalWorkouts(db, USER_ID, 100),
    exerciseNames(db),
  ]);

  const completed = sessions.filter(
    (session) => session.status === "completed",
  );
  const weights = [...metrics].reverse().map((metric) => metric.weightLb);
  const latestWeight = metrics.at(0);
  const strength = topStrengthSeries(completed);
  const totalSets = completed.reduce(
    (count, session) =>
      count +
      session.results.reduce((sets, result) => sets + result.sets.length, 0),
    0,
  );
  const rowingMeters = externals.reduce(
    (meters, workout) =>
      meters + (workout.normalized.summary.distanceMeters ?? 0),
    0,
  );

  return (
    <div className={vstack({ alignItems: "stretch", gap: 6, lg: { gap: 10 } })}>
      <TopBar
        description="Your training and body trends over time."
        icon={<ChartLineIcon size={18} />}
        title="Trends"
      />

      <div className={statGridStyles}>
        <StatTile
          label="Body weight"
          tone="accent"
          value={
            latestWeight === undefined
              ? "—"
              : formatWeight(latestWeight.weightLb)
          }
        />
        <StatTile label="Total sets" value={`${totalSets}`} />
        <StatTile label="Rowing" value={formatDistance(rowingMeters)} />
      </div>

      <div className={chartsStyles}>
        <section className={sectionStyles}>
          <h2 className={sectionTitleStyles}>Body weight</h2>
          <Sparkline label="Body weight trend" values={weights} />
          <BodyWeightForm />
          {metrics.length === 0 ? undefined : (
            <ul className={weighInListStyles}>
              {metrics.map((metric) => (
                <li className={weighInRowStyles} key={metric.id}>
                  <span className={weighInDateStyles}>{metric.date}</span>
                  <span className={weighInWeightStyles}>
                    {formatWeight(metric.weightLb)}
                  </span>
                  <DeleteEntryButton
                    endpoint={`/api/history/body-metrics/${metric.id}`}
                    itemLabel="weigh-in"
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={sectionStyles}>
          <h2 className={sectionTitleStyles}>
            Strength · estimated 1RM
            {strength === undefined
              ? ""
              : ` · ${names.get(strength.exerciseId) ?? strength.exerciseId}`}
          </h2>
          <Sparkline
            label="Estimated 1RM trend"
            values={strength?.values ?? []}
          />
        </section>
      </div>
    </div>
  );
};

export default AnalyticsPage;

const statGridStyles = grid({ columns: 3, gap: 4, lg: { gap: 8 } });

const chartsStyles = grid({
  alignItems: "start",
  gap: 6,
  gridTemplateColumns: { base: "1fr", md: "repeat(2, minmax(0, 1fr))" },
  lg: { gap: 10 },
});

const sectionStyles = vstack({ alignItems: "stretch", gap: 3 });

// A flat, hairline-ruled ledger of individual weigh-ins, each with a delete
// affordance so a mistaken entry can be removed.
const weighInListStyles = css({
  display: "flex",
  flexDirection: "column",
});

const weighInRowStyles = hstack({
  borderBlockEnd: "1px solid {colors.border}",
  gap: 3,
  paddingBlock: 1.5,
});

const weighInDateStyles = css({
  color: "muted",
  flex: 1,
  fontSize: "sm",
  fontVariantNumeric: "tabular-nums",
  minInlineSize: 0,
});

const weighInWeightStyles = css({
  fontVariantNumeric: "tabular-nums",
  fontWeight: "medium",
});

// A ruled section heading gives structure without wrapping the chart in a box;
// the rule carries a hint of accent to keep the flat layout from going cold.
const sectionTitleStyles = css({
  borderBlockEnd:
    "1px solid color-mix(in oklab, {colors.accent} 35%, {colors.border})",
  fontSize: "md",
  fontWeight: "semibold",
  lg: { fontSize: "lg" },
  paddingBlockEnd: 2,
});
