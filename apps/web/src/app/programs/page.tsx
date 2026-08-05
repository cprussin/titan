import { listPrograms, listProgramVersions } from "@titan/db/program-versions";
import type { TrainingBlock } from "@titan/domain/program";
import Link from "next/link";
import { css } from "../../../styled-system/css";
import { hstack, vstack, wrap } from "../../../styled-system/patterns";
import { requireAuth } from "../../auth/session";
import { Badge } from "../../components/Badge";
import { PageHeader } from "../../components/PageHeader";
import { db } from "../../db";
import { latestPrograms } from "../../server/program-explorer";

// Goals cycle through tones so a program's tag row reads as a splash of color
// rather than a monochrome run of accent pills.
const GOAL_TONES = ["accent", "success", "warning"] as const;

const ProgramsPage = async () => {
  await requireAuth();
  const [programs, versions] = await Promise.all([
    listPrograms(db),
    listProgramVersions(db),
  ]);
  const entries = latestPrograms(programs, versions);

  return (
    <div className={vstack({ alignItems: "stretch", gap: 6, lg: { gap: 10 } })}>
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
          <section className={programStyles} key={version.id}>
            <div className={vstack({ alignItems: "stretch", gap: 1.5 })}>
              <h2 className={programNameStyles}>{program.name}</h2>
              <p className={descriptionStyles}>{program.description}</p>
              {program.goals.length > 0 && (
                <ul className={goalsStyles}>
                  {program.goals.map((goal, index) => (
                    <li key={goal}>
                      <Badge tone={GOAL_TONES[index % GOAL_TONES.length]}>
                        {goal}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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

// Programs are flat, separated by whitespace — no card around each one.
const programStyles = vstack({ alignItems: "stretch", gap: 3 });

const programNameStyles = css({
  fontSize: "xl",
  fontWeight: "semibold",
  lg: { fontSize: "2xl" },
});

const descriptionStyles = css({ color: "muted", fontSize: "sm" });

const goalsStyles = wrap({ gap: 1.5, paddingBlockStart: 1 });

// A flat, hairline-ruled block list — two continuous columns on wider screens.
const blockListStyles = css({
  columnGap: 10,
  display: "grid",
  gridTemplateColumns: { base: "1fr", md: "repeat(2, minmax(0, 1fr))" },
  rowGap: 0,
});

const blockRowStyles = hstack({
  // Hover only for a mouse-like pointer, so a tap on touch doesn't leave the
  // row stuck in its highlighted state.
  _pointerFine: {
    _hover: {
      backgroundColor: "color-mix(in oklab, {colors.accent} 10%, transparent)",
    },
  },
  borderBlockEnd: "1px solid {colors.border}",
  borderRadius: "md",
  gap: 3,
  justifyContent: "space-between",
  marginInline: -2,
  paddingBlock: 3.5,
  paddingInline: 2,
  transition: "background-color {durations.fast} {easings.out}",
});

const blockNameStyles = css({ fontWeight: "medium" });

const blockMetaStyles = css({ color: "muted", fontSize: "sm" });

const workoutCountStyles = css({ color: "textTertiary", fontSize: "sm" });

const mutedStyles = css({ color: "muted" });
