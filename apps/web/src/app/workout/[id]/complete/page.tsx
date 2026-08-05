import { listAdaptationDecisionsBySession } from "@titan/db/adaptation-decisions";
import { listPersonalRecords } from "@titan/db/personal-records";
import { getWorkoutSession } from "@titan/db/workout-sessions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { css } from "../../../../../styled-system/css";
import { grid, vstack } from "../../../../../styled-system/patterns";
import { requireAuth } from "../../../../auth/session";
import { StatTile } from "../../../../components/StatTile";
import { db } from "../../../../db";
import { exerciseNames } from "../../../../server/exercise-names";
import { USER_ID } from "../../../../user";

const CompletePage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  await requireAuth();
  const { id } = await params;
  const session = await getWorkoutSession(db, id);
  if (session === undefined) {
    notFound();
  } else {
    const [decisions, records, names] = await Promise.all([
      listAdaptationDecisionsBySession(db, id),
      listPersonalRecords(db, USER_ID),
      exerciseNames(db),
    ]);
    const sessionRecords = records.filter(
      (record) => record.workoutSessionId === id,
    );
    const totalSets = session.results.reduce(
      (count, result) => count + result.sets.length,
      0,
    );
    const durationMin =
      session.startedAt !== undefined && session.completedAt !== undefined
        ? Math.max(
            1,
            Math.round(
              (Date.parse(session.completedAt) -
                Date.parse(session.startedAt)) /
                60_000,
            ),
          )
        : session.estimatedDurationMin;
    const adaptations = decisions.filter(
      (decision) => decision.action !== "maintain",
    );

    return (
      <div className={vstack({ alignItems: "stretch", gap: 4 })}>
        <h1 className={titleStyles}>Workout complete</h1>

        <div className={grid({ columns: 3, gap: 2 })}>
          <StatTile label="Duration" value={`${durationMin} min`} />
          <StatTile label="Sets" value={`${totalSets}`} />
          <StatTile label="PRs" value={`${sessionRecords.length}`} />
        </div>

        {sessionRecords.length > 0 && (
          <section className={cardStyles}>
            <h2 className={sectionTitleStyles}>Personal records</h2>
            <ul className={listStyles}>
              {sessionRecords.map((record) => (
                <li className={rowStyles} key={record.id}>
                  <span>
                    {names.get(record.exerciseId) ?? record.exerciseId}
                  </span>
                  <span className={emphasisStyles}>
                    {record.value} {record.unit} est. 1RM
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={cardStyles}>
          <h2 className={sectionTitleStyles}>
            Why today looked the way it did
          </h2>
          {adaptations.length === 0 ? (
            <p className={mutedStyles}>
              Steady week — prescriptions held from your program.
            </p>
          ) : (
            <ul className={listStyles}>
              {adaptations.map((decision) => (
                <li className={explanationStyles} key={decision.id}>
                  {decision.explanation}
                </li>
              ))}
            </ul>
          )}
        </section>

        <Link className={buttonLinkStyles} href="/">
          Back to dashboard
        </Link>
      </div>
    );
  }
};

export default CompletePage;

const titleStyles = css({ fontSize: "3xl", fontWeight: "bold" });

const cardStyles = vstack({
  alignItems: "stretch",
  backgroundColor: "card",
  border: "1px solid {colors.border}",
  borderRadius: "xl",
  gap: 3,
  padding: 4,
});

const sectionTitleStyles = css({ fontSize: "lg", fontWeight: "semibold" });

const listStyles = vstack({ alignItems: "stretch", gap: 2 });

const rowStyles = css({
  alignItems: "center",
  display: "flex",
  justifyContent: "space-between",
});

const emphasisStyles = css({ color: "success", fontWeight: "semibold" });

const explanationStyles = css({ color: "muted", fontSize: "sm" });

const mutedStyles = css({ color: "muted" });

const buttonLinkStyles = css({
  backgroundColor: "foreground",
  borderRadius: "lg",
  color: "background",
  fontWeight: "semibold",
  paddingBlock: 3,
  textAlign: "center",
});
