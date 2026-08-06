import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { BarbellIcon } from "@phosphor-icons/react/dist/ssr/Barbell";
import { listPrograms, listProgramVersions } from "@titan/db/program-versions";
import type { TrainingBlock } from "@titan/domain/program";
import Link from "next/link";
import { css } from "../../../styled-system/css";
import { grid, hstack, vstack, wrap } from "../../../styled-system/patterns";
import { requireAuth } from "../../auth/session";
import { TopBar } from "../../components/TopBar";
import { db } from "../../db";
import { latestPrograms } from "../../server/program-explorer";
import { Badge, Card } from "../../ui";

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
    <div className={vstack({ alignItems: "stretch", gap: 4 })}>
      <TopBar
        description="Your training programs and the blocks that make them up."
        icon={<BarbellIcon size={18} />}
        title="Programs"
      />
      {entries.length === 0 ? (
        <p className={mutedStyles}>
          No programs loaded. Run <code>bun run --filter @titan/db seed</code>{" "}
          to load the bundled programs.
        </p>
      ) : (
        <div className={gridStyles}>
          {entries.map(({ program, version }) => (
            <Card key={version.id}>
              <div className={headerStyles}>
                <h2 className={programNameStyles}>{program.name}</h2>
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
                <p className={descriptionStyles}>{program.description}</p>
              </div>
              <ul className={blockListStyles}>
                {version.blocks.map((block) => (
                  <li className={blockItemStyles} key={block.id}>
                    <Link
                      className={blockRowStyles}
                      href={`/programs/${version.id}/block/${block.id}`}
                    >
                      <span className={blockTextStyles}>
                        <span className={blockNameStyles}>{block.name}</span>
                        <span className={blockMetaStyles}>
                          {describeBlock(block)}
                        </span>
                      </span>
                      <ArrowRightIcon
                        className={blockArrowStyles}
                        data-block-arrow=""
                        size={16}
                        weight="bold"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
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

// Cards lay out in an auto-fitting grid so they cap their width and pack into
// columns on wide screens rather than stretching edge to edge; below the min
// child width the track count collapses to a single column. `alignItems:
// start` keeps each card its natural height instead of stretching short cards
// to match the tallest in a row.
const gridStyles = grid({
  alignItems: "start",
  gap: 4,
  minChildWidth: "20rem",
});

// The card header groups goals, name, and description tightly. Goals lead so
// the colored tags anchor the top of each card before the name.
const headerStyles = vstack({ alignItems: "flex-start", gap: 1 });

const programNameStyles = css({
  fontSize: "md",
  fontWeight: "semibold",
  lg: { fontSize: "lg" },
});

const descriptionStyles = css({ color: "muted", fontSize: "sm" });

const goalsStyles = wrap({ gap: 1.5, paddingBlockEnd: 0.5 });

// Each block is a tappable row: the name over a muted duration line on the
// left, and a trailing arrow on the right that marks the row as a link. Rows
// are separated by hairline rules (on the list item, so they stay straight)
// and lift on hover with a soft accent tint that bleeds to the row edges; the
// arrow shifts to accent and nudges right. Hover is pointer-fine only so a tap
// doesn't leave a lingering tint.
const blockListStyles = vstack({ alignItems: "stretch", gap: 0 });

// The first item's rule doubles as the header/list divider, so it gets extra
// top padding to sit the first row off the line rather than flush against it.
const blockItemStyles = css({
  _first: { paddingBlockStart: 2 },
  borderBlockStart: "1px solid {colors.border}",
});

const blockRowStyles = hstack({
  _hover: {
    "& [data-block-arrow]": { color: "accent", transform: "translateX(2px)" },
  },
  _pointerFine: {
    _hover: {
      backgroundColor: "color-mix(in oklab, {colors.accent} 10%, transparent)",
    },
  },
  borderRadius: "md",
  gap: 3,
  justifyContent: "space-between",
  marginInline: -2,
  paddingBlock: 2.5,
  paddingInline: 2,
  transition: "background-color {durations.fast} {easings.out}",
});

const blockTextStyles = vstack({ alignItems: "flex-start", gap: 0.5 });

const blockNameStyles = css({ fontSize: "sm", fontWeight: "medium" });

const blockMetaStyles = css({ color: "muted", fontSize: "xs" });

const blockArrowStyles = css({
  color: "textTertiary",
  flexShrink: 0,
  transition:
    "color {durations.fast} {easings.out}, transform {durations.fast} {easings.out}",
});

const mutedStyles = css({ color: "muted" });
