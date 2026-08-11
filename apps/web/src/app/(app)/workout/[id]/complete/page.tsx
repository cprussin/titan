import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { listPersonalRecords } from "@titan/db/personal-records";
import { getWorkoutSession } from "@titan/db/workout-sessions";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { css } from "../../../../../../styled-system/css";
import { grid, vstack } from "../../../../../../styled-system/patterns";
import { DeleteWorkoutButton } from "../../../../../components/DeleteWorkoutButton";
import { StatTile } from "../../../../../components/StatTile";
import { TopBar } from "../../../../../components/TopBar";
import { db } from "../../../../../db";
import { exerciseNames } from "../../../../../server/exercise-names";
import { nextSessionAdaptations } from "../../../../../server/next-adaptations";
import { Badge } from "../../../../../ui";
import { USER_ID } from "../../../../../user";

export const metadata: Metadata = {
  description: "Your session summary and what changes next time.",
  title: "Workout complete",
};

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
    const [adaptations, records, names] = await Promise.all([
      nextSessionAdaptations(db, session),
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

    return (
      <div
        className={vstack({ alignItems: "stretch", gap: 4, lg: { gap: 6 } })}
      >
        <TopBar
          actions={<DeleteWorkoutButton sessionId={id} size="sm" />}
          breadcrumbs={[{ href: "/history", label: "History" }]}
          icon={<CheckCircleIcon size={18} />}
          title={session.scheduledDate}
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
            <h2 className={sectionTitleStyles}>Next session</h2>
            {adaptations.length === 0 ? (
              <p className={mutedStyles}>
                Steady week — prescriptions hold from your program.
              </p>
            ) : (
              <ul className={adaptationListStyles}>
                {adaptations.map((adaptation) => (
                  <li className={adaptationRowStyles} key={adaptation.slotId}>
                    <span className={adaptationTextStyles}>
                      <span className={adaptationNameStyles}>
                        {names.get(adaptation.exerciseId) ??
                          adaptation.exerciseId}
                      </span>
                      <span className={explanationStyles}>
                        {adaptation.explanation}
                      </span>
                    </span>
                    <Badge tone={adaptation.progressed ? "success" : "neutral"}>
                      {adaptation.progressed ? "Progressed" : "Held"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
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

// Each adaptation is a hairline-ruled row: the exercise over its reason on the
// start, a Progressed/Held badge on the trailing edge. No rule above the first.
const adaptationRowStyles = css({
  _first: { borderBlockStart: "none", paddingBlockStart: 0 },
  alignItems: "flex-start",
  borderBlockStart: "1px solid {colors.border}",
  display: "flex",
  gap: 3,
  justifyContent: "space-between",
  paddingBlock: 2.5,
});

const adaptationListStyles = vstack({
  alignItems: "stretch",
  gap: 0,
  listStyleType: "none",
  margin: 0,
  padding: 0,
});

const adaptationTextStyles = vstack({
  alignItems: "flex-start",
  gap: 0.5,
  minInlineSize: 0,
});

const adaptationNameStyles = css({ fontWeight: "medium" });

const explanationStyles = css({ color: "muted", fontSize: "sm" });

const mutedStyles = css({ color: "muted" });
