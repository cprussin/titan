import { listBodyMetrics } from "@titan/db/body-metrics";
import { listWorkoutSessions } from "@titan/db/workout-sessions";
import Link from "next/link";
import { css } from "../../styled-system/css";
import { grid, hstack, vstack } from "../../styled-system/patterns";
import { requireAuth } from "../auth/session";
import { StartWorkoutButton } from "../components/StartWorkoutButton";
import { StatTile } from "../components/StatTile";
import { dateIso } from "../date";
import { db } from "../db";
import { formatWeight } from "../format";
import { describePrescription } from "../prescription-text";
import { exerciseNames } from "../server/exercise-names";
import type { Today } from "../server/today";
import { resolveToday } from "../server/today";
import { USER_ID } from "../user";

const DashboardPage = async () => {
  await requireAuth();
  const today = await resolveToday(db, USER_ID, dateIso());
  const [names, metrics, sessions] = await Promise.all([
    exerciseNames(db),
    listBodyMetrics(db, USER_ID, 30),
    listWorkoutSessions(db, USER_ID, 50),
  ]);

  return (
    <div className={pageStyles}>
      <h1 className={titleStyles}>Today</h1>
      {renderToday(today, names, metrics, sessions)}
    </div>
  );
};

export default DashboardPage;

const renderToday = (
  today: Today,
  names: Map<string, string>,
  metrics: readonly { weightLb: number }[],
  sessions: readonly {
    status: string;
    programVersionId: string;
    weekNumber: number;
  }[],
) => {
  switch (today.kind) {
    case "no-program": {
      return (
        <p className={mutedStyles}>
          No active program. Run <code>bun run --filter @titan/db seed</code> to
          load the bundled programs.
        </p>
      );
    }
    case "rest": {
      return (
        <div className={cardStyles}>
          <h2 className={sessionTitleStyles}>Rest day</h2>
          <p className={mutedStyles}>
            Recover well — walk, stretch, foam roll, or take an easy row under
            20 minutes. No prescribed intensity.
          </p>
        </div>
      );
    }
    case "workout": {
      return renderWorkout(today, names, metrics, sessions);
    }
  }
};

const renderWorkout = (
  today: Extract<Today, { kind: "workout" }>,
  names: Map<string, string>,
  metrics: readonly { weightLb: number }[],
  sessions: readonly {
    status: string;
    programVersionId: string;
    weekNumber: number;
  }[],
) => {
  const scheduledDays = today.position.block.weekTemplate.days.length;
  const completed = sessions.filter(
    (session) =>
      session.status === "completed" &&
      session.programVersionId === today.programVersion.id &&
      session.weekNumber === today.position.weekInBlock,
  ).length;
  const latest = metrics.at(0);
  const previous = metrics.at(1);
  const trend =
    latest !== undefined && previous !== undefined
      ? `${latest.weightLb >= previous.weightLb ? "▲" : "▼"} ${formatWeight(Math.abs(latest.weightLb - previous.weightLb))}`
      : undefined;

  return (
    <div className={vstack({ alignItems: "stretch", gap: 4 })}>
      <p className={contextStyles}>
        {today.position.block.name} · Week {today.position.weekInBlock}
        {today.position.isDeloadWeek ? " · Deload" : ""}
      </p>

      <div className={statGridStyles}>
        <StatTile
          hint={
            today.resolved.variantLabel === undefined
              ? undefined
              : today.resolved.variantLabel
          }
          label="Est. time"
          value={`${today.resolved.estimatedDurationMin} min`}
        />
        <StatTile label="This week" value={`${completed}/${scheduledDays}`} />
        <StatTile
          hint={trend}
          label="Body weight"
          value={latest === undefined ? "—" : formatWeight(latest.weightLb)}
        />
      </div>

      <div className={cardStyles}>
        <h2 className={sessionTitleStyles}>{today.template.name}</h2>
        <ul className={planStyles}>
          {today.resolved.prescribedExercises.map((exercise) => (
            <li className={rowStyles} key={exercise.slotId}>
              <div className={vstack({ alignItems: "flex-start", gap: 0.5 })}>
                <span className={exerciseNameStyles}>
                  {names.get(exercise.exerciseId) ?? exercise.exerciseId}
                </span>
                <span className={targetStyles}>
                  {describePrescription(exercise.prescription)}
                </span>
              </div>
              <span className={rolePillStyles}>{exercise.role}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={actionsStyles}>
        <Link className={readinessLinkStyles} href="/readiness">
          Log readiness
        </Link>
        <StartWorkoutButton />
      </div>
    </div>
  );
};

const pageStyles = vstack({ alignItems: "stretch", gap: 4 });

const titleStyles = css({ fontSize: "3xl", fontWeight: "bold" });

const contextStyles = css({
  color: "muted",
  fontSize: "sm",
  fontWeight: "medium",
});

const statGridStyles = grid({ columns: 3, gap: 2 });

const cardStyles = vstack({
  alignItems: "stretch",
  backgroundColor: "card",
  border: "1px solid {colors.border}",
  borderRadius: "xl",
  gap: 3,
  padding: 4,
});

const sessionTitleStyles = css({ fontSize: "lg", fontWeight: "semibold" });

const planStyles = vstack({ alignItems: "stretch", gap: 0 });

const rowStyles = hstack({
  _first: { borderBlockStart: "none", paddingBlockStart: 0 },
  borderBlockStart: "1px solid {colors.border}",
  justifyContent: "space-between",
  paddingBlock: 3,
});

const exerciseNameStyles = css({ fontWeight: "medium" });

const targetStyles = css({ color: "muted", fontSize: "sm" });

const rolePillStyles = css({
  backgroundColor: "color-mix(in oklab, {colors.foreground} 8%, transparent)",
  borderRadius: "full",
  color: "textTertiary",
  fontSize: "xs",
  paddingBlock: 0.5,
  paddingInline: 2,
});

const actionsStyles = vstack({ alignItems: "stretch", gap: 2 });

const readinessLinkStyles = css({
  color: "accent",
  fontSize: "sm",
  fontWeight: "medium",
  textAlign: "center",
});

const mutedStyles = css({ color: "muted" });
