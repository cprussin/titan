import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { BarbellIcon } from "@phosphor-icons/react/dist/ssr/Barbell";
import type { AthleteState } from "@titan/db/athlete-state";
import { getAthleteState } from "@titan/db/athlete-state";
import { listPrograms, listProgramVersions } from "@titan/db/program-versions";
import type { TrainingBlock } from "@titan/domain/program";
import Link from "next/link";
import { css } from "../../../../styled-system/css";
import { vstack, wrap } from "../../../../styled-system/patterns";
import { BlockActionsMenu } from "../../../components/BlockActionsMenu";
import { TopBar } from "../../../components/TopBar";
import { db } from "../../../db";
import { isActiveBlock } from "../../../server/active-block";
import type { ProgramWithVersion } from "../../../server/program-explorer";
import { latestPrograms } from "../../../server/program-explorer";
import { Badge, Card } from "../../../ui";
import { USER_ID } from "../../../user";

// Goals cycle through tones so a program's tag row reads as a splash of color
// rather than a monochrome run of accent pills.
const GOAL_TONES = ["accent", "success", "warning"] as const;

const ProgramsPage = async () => {
  const [programs, versions, state] = await Promise.all([
    listPrograms(db),
    listProgramVersions(db),
    getAthleteState(db, USER_ID),
  ]);
  const entries = latestPrograms(programs, versions);
  const activeEntry = entries.find(
    (entry) => entry.version.id === state?.programVersionId,
  );
  const otherEntries = entries.filter((entry) => entry !== activeEntry);

  return (
    <div className={pageStyles}>
      <TopBar icon={<BarbellIcon size={18} />} title="Programs" />
      {entries.length === 0 ? (
        <p className={mutedStyles}>
          No programs loaded. Run <code>bun run --filter @titan/db seed</code>{" "}
          to load the bundled programs.
        </p>
      ) : (
        <>
          {activeEntry !== undefined && (
            <section className={sectionStyles}>
              <h2 className={sectionHeadingStyles}>Active program</h2>
              <div className={gridStyles}>
                {renderProgramCard(activeEntry, state)}
              </div>
            </section>
          )}
          {otherEntries.length > 0 && (
            <section className={sectionStyles}>
              {activeEntry !== undefined && (
                <h2 className={sectionHeadingStyles}>All programs</h2>
              )}
              <div className={gridStyles}>
                {otherEntries.map((entry) => renderProgramCard(entry, state))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default ProgramsPage;

/** One program card: its header, goals, and description over a list of blocks.
 *  Each block row links to its detail view (marked by a trailing arrow) with a
 *  target control layered on top to make the block active. */
const renderProgramCard = (
  { program, version }: ProgramWithVersion,
  state: AthleteState | undefined,
) => (
  <Card key={version.id}>
    <div className={headerStyles}>
      <h3 className={programNameStyles}>{program.name}</h3>
      {program.goals.length > 0 && (
        <ul className={goalsStyles}>
          {program.goals.map((goal, index) => (
            <li key={goal}>
              <Badge tone={GOAL_TONES[index % GOAL_TONES.length]}>{goal}</Badge>
            </li>
          ))}
        </ul>
      )}
      <p className={descriptionStyles}>{program.description}</p>
    </div>
    <ul className={blockListStyles}>
      {version.blocks.map((block) => {
        const active = isActiveBlock(state, version, block.id);
        return (
          <li className={blockItemStyles} key={block.id}>
            <div className={blockRowStyles}>
              <Link
                className={blockLinkStyles}
                href={`/programs/${version.id}/block/${block.id}`}
              >
                <span className={blockTextStyles}>
                  <span className={blockNameStyles} data-block-name="">
                    {block.name}
                  </span>
                  <span className={blockMetaStyles}>
                    {describeBlock(block)}
                  </span>
                </span>
              </Link>
              <BlockActionsMenu
                active={active}
                blockId={block.id}
                blockName={block.name}
                versionId={version.id}
              />
              <ArrowRightIcon
                className={blockArrowStyles}
                data-block-arrow=""
                size={16}
                weight="bold"
              />
            </div>
          </li>
        );
      })}
    </ul>
  </Card>
);

/** A one-line summary of a block's length and deload cadence. */
const describeBlock = (block: TrainingBlock): string => {
  const weeks = `${block.durationWeeks} week${block.durationWeeks === 1 ? "" : "s"}`;
  return block.deloadEveryWeeks === undefined
    ? weeks
    : `${weeks} · deload every ${block.deloadEveryWeeks} weeks`;
};

const pageStyles = vstack({ alignItems: "stretch", gap: 6 });

// Each labeled section — the lifted "Active program" and the rest — stacks its
// heading over its grid.
const sectionStyles = vstack({ alignItems: "stretch", gap: 3 });

const sectionHeadingStyles = css({
  color: "muted",
  fontSize: "xs",
  fontWeight: "semibold",
  letterSpacing: "wide",
  textTransform: "uppercase",
});

// Cards pack into an auto-filling grid so they cap their width and column up on
// wide screens. `auto-fill` (not `auto-fit`) keeps the empty tracks, so a lone
// card — the active program on its own — stays one column wide instead of
// stretching to fill the row. `alignItems: start` keeps each card its natural
// height rather than matching the tallest in its row.
const gridStyles = css({
  alignItems: "start",
  display: "grid",
  gap: 4,
  gridTemplateColumns: "repeat(auto-fill, minmax(20rem, 1fr))",
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

// The blocks read as a hairline-ruled ledger under the header.
const blockListStyles = vstack({ alignItems: "stretch", gap: 0 });

// The first item's rule doubles as the header/list divider, so it gets extra
// top padding to sit the first row off the line rather than flush against it.
const blockItemStyles = css({
  _first: { paddingBlockStart: 2 },
  borderBlockStart: "1px solid {colors.border}",
});

// The whole row reads as one block "button": it's the positioning context for
// the link's stretched overlay, and carries the row padding (bled to the card
// edges) so the hover tint spans edge to edge.
const blockRowStyles = css({
  alignItems: "center",
  borderRadius: "md",
  display: "flex",
  gap: 2,
  marginInline: -2,
  paddingBlock: 2,
  paddingInline: 2,
  position: "relative",
});

// The link holds the block name over its muted duration line and grows to fill
// the row. Its `::after` stretches across the whole row (the positioned parent)
// so a tap anywhere on the row — except on the activate control layered above
// it — navigates to the block detail. Hovering that area lifts a soft accent
// tint and shifts the name and the trailing arrow (a following sibling) to
// accent; hovering the activate control (above the overlay) does neither.
const blockLinkStyles = css({
  _hover: {
    "& [data-block-name]": { color: "accent" },
  },
  _pointerFine: {
    "&:hover::after": {
      backgroundColor: "color-mix(in oklab, {colors.accent} 10%, transparent)",
    },
  },
  "&::after": {
    borderRadius: "md",
    content: '""',
    inset: 0,
    position: "absolute",
    transition: "background-color {durations.fast} {easings.out}",
  },
  "&:hover ~ [data-block-arrow]": {
    color: "accent",
    transform: "translateX(2px)",
  },
  alignItems: "center",
  display: "flex",
  flexGrow: 1,
  minInlineSize: 0,
});

const blockTextStyles = vstack({
  alignItems: "flex-start",
  flexGrow: 1,
  gap: 0.5,
  minInlineSize: 0,
});

const blockNameStyles = css({
  color: "foreground",
  fontSize: "sm",
  fontWeight: "medium",
  transition: "color {durations.fast} {easings.out}",
});

const blockMetaStyles = css({ color: "muted", fontSize: "xs" });

// A direct flex child of the centered row, `display: block` so the inline SVG's
// baseline gap doesn't nudge it off the row's vertical center beside the
// activate control. It's decorative, so `pointer-events: none` lets hover and
// taps fall through to the link's stretched overlay beneath it — the row still
// highlights and navigates when the pointer is over the arrow.
const blockArrowStyles = css({
  color: "textTertiary",
  display: "block",
  flexShrink: 0,
  pointerEvents: "none",
  transition:
    "color {durations.fast} {easings.out}, transform {durations.fast} {easings.out}",
});

const mutedStyles = css({ color: "muted" });
