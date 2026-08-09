import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { listAdaptationDecisionsBySession } from "@titan/db/adaptation-decisions";
import { listPersonalRecords } from "@titan/db/personal-records";
import { getWorkoutSession } from "@titan/db/workout-sessions";
import { notFound } from "next/navigation";
import { css } from "../../../../../../styled-system/css";
import { grid, vstack } from "../../../../../../styled-system/patterns";
import { DeleteWorkoutButton } from "../../../../../components/DeleteWorkoutButton";
import { StatTile } from "../../../../../components/StatTile";
import { TopBar } from "../../../../../components/TopBar";
import { db } from "../../../../../db";
import { exerciseNames } from "../../../../../server/exercise-names";
import { Button } from "../../../../../ui";
import { USER_ID } from "../../../../../user";

const CompletePage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
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
      <div
        className={vstack({ alignItems: "stretch", gap: 4, lg: { gap: 6 } })}
      >
        <TopBar
          actions={<DeleteWorkoutButton sessionId={id} size="sm" />}
          breadcrumbs={[{ href: "/", label: "Today" }]}
          description="Nice work — here's the recap."
          icon={<CheckCircleIcon size={18} />}
          title="Workout complete"
        />

        <div className={statGridStyles}>
          <StatTile
            label="Duration"
            tone="accent"
            value={`${durationMin} min`}
          />
          <StatTile label="Sets" value={`${totalSets}`} />
          <StatTile
            label="PRs"
            tone={sessionRecords.length > 0 ? "success" : "neutral"}
            value={`${sessionRecords.length}`}
          />
        </div>

        <div className={sectionsStyles}>
          {sessionRecords.length > 0 && (
            <section className={sectionStyles}>
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

          <section className={sectionStyles}>
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
        </div>

        <div className={backStyles}>
          <Button href="/" size="lg" variant="accent">
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }
};

export default CompletePage;

const statGridStyles = grid({ columns: 3, gap: 4, lg: { gap: 8 } });

// The two recap panels sit side by side when both are present and there's
// room; a lone panel (no PRs this session) fills the width instead of stranding
// half of it.
const sectionsStyles = grid({
  alignItems: "start",
  gap: 6,
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 20rem), 1fr))",
  lg: { gap: 10 },
});

const sectionStyles = vstack({ alignItems: "stretch", gap: 3 });

// A ruled heading structures each panel without wrapping it in a box; a hint of
// accent in the rule keeps the recap from reading flat-gray.
const sectionTitleStyles = css({
  borderBlockEnd:
    "1px solid color-mix(in oklab, {colors.accent} 35%, {colors.border})",
  fontSize: "lg",
  fontWeight: "semibold",
  paddingBlockEnd: 2,
});

const listStyles = vstack({ alignItems: "stretch", gap: 2 });

const rowStyles = css({
  alignItems: "center",
  display: "flex",
  gap: 3,
  justifyContent: "space-between",
});

const emphasisStyles = css({ color: "success", fontWeight: "semibold" });

const explanationStyles = css({ color: "muted", fontSize: "sm" });

const mutedStyles = css({ color: "muted" });

const backStyles = css({ marginBlockStart: 2 });
