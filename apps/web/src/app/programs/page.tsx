import { listPrograms, listProgramVersions } from "@titan/db/program-versions";
import type { TrainingBlock } from "@titan/domain/program";
import Link from "next/link";
import { css } from "../../../styled-system/css";
import { grid, hstack, vstack, wrap } from "../../../styled-system/patterns";
import { requireAuth } from "../../auth/session";
import { PageHeader } from "../../components/PageHeader";
import { db } from "../../db";
import { latestPrograms } from "../../server/program-explorer";

const ProgramsPage = async () => {
  await requireAuth();
  const [programs, versions] = await Promise.all([
    listPrograms(db),
    listProgramVersions(db),
  ]);
  const entries = latestPrograms(programs, versions);

  return (
    <div className={vstack({ alignItems: "stretch", gap: 4, lg: { gap: 6 } })}>
      <PageHeader
        description="Your training programs and the blocks that make them up."
        title="Programs"
      />
      {entries.length === 0 ? (
        <p className={mutedStyles}>
          No programs loaded. Run <code>bun run --filter @titan/db seed</code>{" "}
          to load the bundled programs.
        </p>
      ) : (
        entries.map(({ program, version }) => (
          <section className={cardStyles} key={version.id}>
            <div className={vstack({ alignItems: "stretch", gap: 1 })}>
              <h2 className={programNameStyles}>{program.name}</h2>
              <p className={descriptionStyles}>{program.description}</p>
            </div>
            {program.goals.length > 0 && (
              <ul className={goalsStyles}>
                {program.goals.map((goal) => (
                  <li className={goalPillStyles} key={goal}>
                    {goal}
                  </li>
                ))}
              </ul>
            )}
            <ul className={blockListStyles}>
              {version.blocks.map((block) => (
                <li key={block.id}>
                  <Link
                    className={blockRowStyles}
                    href={`/programs/${version.id}/block/${block.id}`}
                  >
                    <div
                      className={vstack({ alignItems: "flex-start", gap: 0.5 })}
                    >
                      <span className={blockNameStyles}>{block.name}</span>
                      <span className={blockMetaStyles}>
                        {describeBlock(block)}
                      </span>
                    </div>
                    <span className={workoutCountStyles}>
                      {countWorkouts(block)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
};

export default ProgramsPage;

/** A one-line summary of a block's length and deload cadence. */
const describeBlock = (block: TrainingBlock): string => {
  const weeks = `${block.durationWeeks} week${block.durationWeeks === 1 ? "" : "s"}`;
  return block.deloadEveryWeeks === undefined
    ? weeks
    : `${weeks} · deload every ${block.deloadEveryWeeks} weeks`;
};

/** How many workouts the block's week schedules, labeled for the summary pill. */
const countWorkouts = (block: TrainingBlock): string => {
  const count = block.weekTemplate.days.length;
  return `${count} workout${count === 1 ? "" : "s"}`;
};

const cardStyles = vstack({
  alignItems: "stretch",
  backgroundColor: "card",
  border: "1px solid {colors.border}",
  borderRadius: "2xl",
  gap: 3,
  lg: { gap: 4, padding: 6 },
  padding: 4,
});

const programNameStyles = css({
  fontSize: "lg",
  fontWeight: "semibold",
  lg: { fontSize: "xl" },
});

const descriptionStyles = css({ color: "muted", fontSize: "sm" });

const goalsStyles = wrap({ gap: 1.5 });

const goalPillStyles = css({
  backgroundColor: "color-mix(in oklab, {colors.accent} 14%, transparent)",
  borderRadius: "full",
  color: "color-mix(in oklab, {colors.accent} 82%, {colors.foreground})",
  fontSize: "xs",
  fontWeight: "medium",
  paddingBlock: 0.5,
  paddingInline: 2,
});

const blockListStyles = grid({
  alignItems: "stretch",
  gap: 2,
  gridTemplateColumns: { base: "1fr", md: "repeat(2, minmax(0, 1fr))" },
});

const blockRowStyles = hstack({
  // Hover feedback only for a mouse-like pointer, so a tap on touch doesn't
  // leave the row stuck in its highlighted state.
  _pointerFine: {
    _hover: {
      backgroundColor:
        "color-mix(in oklab, {colors.foreground} 4%, transparent)",
      borderColor: "borderStrong",
    },
  },
  blockSize: "100%",
  border: "1px solid {colors.border}",
  borderRadius: "lg",
  justifyContent: "space-between",
  padding: 3,
  transition:
    "border-color {durations.fast} {easings.out}, background-color {durations.fast} {easings.out}",
});

const blockNameStyles = css({ fontWeight: "medium" });

const blockMetaStyles = css({ color: "muted", fontSize: "sm" });

const workoutCountStyles = css({ color: "textTertiary", fontSize: "sm" });

const mutedStyles = css({ color: "muted" });
