import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { listPrograms, listProgramVersions } from "@titan/db/program-versions";
import type { TrainingBlock } from "@titan/domain/program";
import Link from "next/link";
import { css } from "../../../styled-system/css";
import { hstack, vstack, wrap } from "../../../styled-system/patterns";
import { requireAuth } from "../../auth/session";
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
    <div className={vstack({ alignItems: "stretch", gap: 4 })}>
      <h1 className={titleStyles}>Programs</h1>
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
                      <span className={blockNameStyles} data-block-name>
                        {block.name}
                      </span>
                      <span className={blockMetaStyles}>
                        {describeBlock(block)}
                      </span>
                    </div>
                    <div className={hstack({ gap: 1.5 })}>
                      <span className={workoutCountStyles}>
                        {countWorkouts(block)}
                      </span>
                      <CaretRightIcon
                        className={caretStyles}
                        data-block-caret
                      />
                    </div>
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

const titleStyles = css({ fontSize: "3xl", fontWeight: "bold" });

const cardStyles = vstack({
  alignItems: "stretch",
  backgroundColor: "card",
  border: "1px solid {colors.border}",
  borderRadius: "lg",
  boxShadow: "md",
  gap: 2.5,
  padding: 4,
});

const programNameStyles = css({ fontSize: "md", fontWeight: "semibold" });

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

// The blocks read as a divided list of navigable rows — a top rule on every
// row (including the first) sets the list off from the goals/description above,
// and each row's name and caret shift to `accent` on hover to signal the link.
const blockListStyles = vstack({ alignItems: "stretch", gap: 0 });

const blockRowStyles = hstack({
  "&:hover [data-block-caret]": { color: "accent" },
  "&:hover [data-block-name]": { color: "accent" },
  borderBlockStart: "1px solid {colors.border}",
  gap: 3,
  justifyContent: "space-between",
  paddingBlock: 2.5,
});

const blockNameStyles = css({
  fontSize: "sm",
  fontWeight: "medium",
  transition: "color {durations.fast} {easings.default}",
});

const blockMetaStyles = css({ color: "muted", fontSize: "xs" });

const workoutCountStyles = css({ color: "textTertiary", fontSize: "xs" });

const caretStyles = css({
  color: "textTertiary",
  flexShrink: 0,
  fontSize: "md",
  transition: "color {durations.fast} {easings.default}",
});

const mutedStyles = css({ color: "muted" });
