import { listBodyMetrics } from "@titan/db/body-metrics";
import { listExternalWorkouts } from "@titan/db/external-workouts";
import { listWorkoutSessions } from "@titan/db/workout-sessions";
import { css } from "../../../styled-system/css";
import { grid, vstack } from "../../../styled-system/patterns";
import { requireAuth } from "../../auth/session";
import { BodyWeightForm } from "../../components/BodyWeightForm";
import { PageHeader } from "../../components/PageHeader";
import { Sparkline } from "../../components/Sparkline";
import { StatTile } from "../../components/StatTile";
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
    <div className={vstack({ alignItems: "stretch", gap: 4, lg: { gap: 6 } })}>
      <PageHeader
        description="Your training and body trends over time."
        title="Trends"
      />

      <div className={statGridStyles}>
        <StatTile
          label="Body weight"
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
        <section className={cardStyles}>
          <h2 className={sectionTitleStyles}>Body weight</h2>
          <Sparkline label="Body weight trend" values={weights} />
          <BodyWeightForm />
        </section>

        <section className={cardStyles}>
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

const statGridStyles = grid({ columns: 3, gap: 2, lg: { gap: 4 } });

const chartsStyles = grid({
  alignItems: "start",
  gap: 4,
  gridTemplateColumns: { base: "1fr", md: "repeat(2, minmax(0, 1fr))" },
  lg: { gap: 6 },
});

const cardStyles = vstack({
  alignItems: "stretch",
  backgroundColor: "card",
  border: "1px solid {colors.border}",
  borderRadius: "2xl",
  gap: 3,
  lg: { gap: 4, padding: 6 },
  padding: 4,
});

const sectionTitleStyles = css({
  fontSize: "md",
  fontWeight: "semibold",
  lg: { fontSize: "lg" },
});
