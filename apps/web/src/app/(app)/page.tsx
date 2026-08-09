import { HouseIcon } from "@phosphor-icons/react/dist/ssr/House";
import { listBodyMetrics } from "@titan/db/body-metrics";
import { listWorkoutSessions } from "@titan/db/workout-sessions";
import Link from "next/link";
import { css } from "../../../styled-system/css";
import { grid, hstack, vstack } from "../../../styled-system/patterns";
import { CancelWorkoutButton } from "../../components/CancelWorkoutButton";
import { PrescriptionTarget } from "../../components/PrescriptionTarget";
import { StartWorkoutButton } from "../../components/StartWorkoutButton";
import { StatTile } from "../../components/StatTile";
import { TopBar } from "../../components/TopBar";
import { dateIso } from "../../date";
import { db } from "../../db";
import { formatWeight } from "../../format";
import { roleTone } from "../../role-tone";
import { exerciseNames } from "../../server/exercise-names";
import { findResumableSession } from "../../server/resumable-session";
import type { Today } from "../../server/today";
import { resolveToday } from "../../server/today";
import { Badge, Button } from "../../ui";
import { USER_ID } from "../../user";

const DashboardPage = async () => {
  const date = dateIso();
  const today = await resolveToday(db, USER_ID, date);
  const [names, metrics, sessions] = await Promise.all([
    exerciseNames(db),
    listBodyMetrics(db, USER_ID, 30),
    listWorkoutSessions(db, USER_ID, 50),
  ]);
  const resumableId = findResumableSession(sessions, date)?.id;

  return (
    <div className={pageStyles}>
      <TopBar
        description={todayDescription(today)}
        icon={<HouseIcon size={18} />}
        title="Today"
      />
      {renderToday(today, names, metrics, sessions, resumableId)}
    </div>
  );
};

export default DashboardPage;

/** The one-line subtitle under the "Today" heading, describing where in the
 *  program today sits — or the day's mode when there's nothing prescribed. */
const todayDescription = (today: Today): string | undefined => {
  switch (today.kind) {
    case "no-program": {
      return undefined;
    }
    case "rest": {
      return "Recovery day";
    }
    case "workout": {
      return `${today.position.block.name} · Week ${today.position.weekInBlock}${
        today.position.isDeloadWeek ? " · Deload" : ""
      }`;
    }
  }
};

const renderToday = (
  today: Today,
  names: Map<string, string>,
  metrics: readonly { weightLb: number }[],
  sessions: readonly {
    status: string;
    programVersionId: string;
    weekNumber: number;
  }[],
  resumableId: string | undefined,
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
        <section className={vstack({ alignItems: "flex-start", gap: 2 })}>
          <h2 className={sessionTitleStyles}>Rest day</h2>
          <p className={restCopyStyles}>
            Recover well — walk, stretch, foam roll, or take an easy row under
            20 minutes. No prescribed intensity.
          </p>
        </section>
      );
    }
    case "workout": {
      return renderWorkout(today, names, metrics, sessions, resumableId);
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
  resumableId: string | undefined,
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
    <div className={vstack({ alignItems: "stretch", gap: 4, lg: { gap: 6 } })}>
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
        <StatTile
          label="This week"
          tone="accent"
          value={`${completed}/${scheduledDays}`}
        />
        <StatTile
          hint={trend}
          label="Body weight"
          value={latest === undefined ? "—" : formatWeight(latest.weightLb)}
        />
      </div>

      <div className={workoutBodyStyles}>
        <section className={planStyles}>
          <h2 className={sessionTitleStyles}>{today.template.name}</h2>
          <ul className={planListStyles}>
            {today.resolved.prescribedExercises.map((exercise) => (
              <li className={rowStyles} key={exercise.slotId}>
                <div className={vstack({ alignItems: "flex-start", gap: 0.5 })}>
                  <span className={exerciseNameStyles}>
                    {names.get(exercise.exerciseId) ?? exercise.exerciseId}
                  </span>
                  <PrescriptionTarget prescription={exercise.prescription} />
                </div>
                <Badge tone={roleTone(exercise.role)}>{exercise.role}</Badge>
              </li>
            ))}
          </ul>
        </section>

        <div className={actionsStyles}>
          {resumableId === undefined ? (
            <>
              <StartWorkoutButton />
              <Link className={readinessLinkStyles} href="/readiness">
                Log readiness
              </Link>
            </>
          ) : (
            <>
              <Button
                href={`/workout/${resumableId}`}
                size="xl"
                variant="accent"
              >
                Resume workout
              </Button>
              <CancelWorkoutButton sessionId={resumableId} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const pageStyles = vstack({ alignItems: "stretch", gap: 4, lg: { gap: 6 } });

const statGridStyles = grid({ columns: 3, gap: 4, lg: { gap: 8 } });

// On desktop the exercise plan and the start/resume actions sit side by side,
// separated by whitespace rather than a box; on phones they stack.
const workoutBodyStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: 6,
  md: {
    alignItems: "start",
    display: "grid",
    gap: 10,
    gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
  },
});

const planStyles = vstack({ alignItems: "stretch", gap: 2 });

const sessionTitleStyles = css({
  fontSize: "lg",
  fontWeight: "semibold",
  lg: { fontSize: "xl" },
});

const planListStyles = vstack({ alignItems: "stretch", gap: 0 });

const rowStyles = hstack({
  _first: { borderBlockStart: "none" },
  borderBlockStart: "1px solid {colors.border}",
  gap: 3,
  justifyContent: "space-between",
  paddingBlock: 3.5,
});

const exerciseNameStyles = css({ fontWeight: "medium" });

// Flat on both: just a stacked, sticky action column — no rail box. On desktop
// it stays in view beside the plan as the plan scrolls.
const actionsStyles = css({
  alignItems: "stretch",
  display: "flex",
  flexDirection: "column",
  gap: 3,
  md: { insetBlockStart: 8, position: "sticky" },
});

const readinessLinkStyles = css({
  color: "accent",
  fontSize: "sm",
  fontWeight: "medium",
  textAlign: "center",
});

const restCopyStyles = css({ color: "muted", maxInlineSize: "40rem" });

const mutedStyles = css({ color: "muted" });
