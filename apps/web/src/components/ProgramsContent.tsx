import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { BarbellIcon } from "@phosphor-icons/react/dist/ssr/Barbell";
import Link from "next/link";
import { css } from "../../styled-system/css";
import { vstack, wrap } from "../../styled-system/patterns";
import type { Loadable } from "../loadable";
import type { Tone } from "../ui";
import { Badge, Card, Skeleton } from "../ui";
import { BlockActionsMenu } from "./BlockActionsMenu";
import { TopBar } from "./TopBar";

// Goals cycle through tones so a program's tag row reads as a splash of color
// rather than a monochrome run of accent pills.
const GOAL_TONES: readonly Tone[] = ["accent", "success", "warning"];

type BlockRowData = {
  active: boolean;
  id: string;
  meta: string;
  name: string;
  versionId: string;
};

export type ProgramCardData = {
  blocks: readonly BlockRowData[];
  description: string;
  goals: readonly string[];
  name: string;
  versionId: string;
};

export type ProgramsData = {
  active: ProgramCardData | undefined;
  others: readonly ProgramCardData[];
};

type Props = {
  load: Loadable<ProgramsData>;
};

/** The programs explorer and its loading fallback, sharing one tree: labeled
 *  sections of program cards, each a header over a list of block rows. While
 *  loading, an auto-filling grid of placeholder cards stands in; each real card
 *  resolves its name, goals, description, and blocks at the leaves. */
export const ProgramsContent = ({ load }: Props) => (
  <div className={pageStyles}>
    <TopBar icon={<BarbellIcon size={18} />} title="Programs" />
    {load.isLoading ? (
      <div className={gridStyles}>
        {PLACEHOLDER_CARDS.map((card) => (
          <ProgramCard key={card} load={{ isLoading: true }} />
        ))}
      </div>
    ) : (
      <LoadedPrograms data={load.value} />
    )}
  </div>
);

/** The resolved sections: the lifted active program, then the rest — or a note
 *  when no programs are loaded. */
const LoadedPrograms = ({ data }: { data: ProgramsData }) =>
  data.active === undefined && data.others.length === 0 ? (
    <p className={mutedStyles}>
      No programs loaded. Run <code>bun run --filter @titan/db seed</code> to
      load the bundled programs.
    </p>
  ) : (
    <>
      {data.active !== undefined && (
        <section className={sectionStyles}>
          <h2 className={sectionHeadingStyles}>Active program</h2>
          <div className={gridStyles}>
            <ProgramCard load={{ isLoading: false, value: data.active }} />
          </div>
        </section>
      )}
      {data.others.length > 0 && (
        <section className={sectionStyles}>
          {data.active !== undefined && (
            <h2 className={sectionHeadingStyles}>All programs</h2>
          )}
          <div className={gridStyles}>
            {data.others.map((card) => (
              <ProgramCard
                key={card.versionId}
                load={{ isLoading: false, value: card }}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );

/** One program card: its header, goals, and description over a list of blocks —
 *  a header and block-row skeletons while loading. */
const ProgramCard = ({ load }: { load: Loadable<ProgramCardData> }) => (
  <Card>
    <div className={headerStyles}>
      {load.isLoading ? (
        <>
          <div className={goalsStyles}>
            <Skeleton height="1.25rem" radius="full" width="4rem" />
            <Skeleton height="1.25rem" radius="full" width="5rem" />
          </div>
          <Skeleton height="1.75rem" radius="md" width="12rem" />
          <Skeleton height="0.875rem" width="100%" />
        </>
      ) : (
        <>
          <h3 className={programNameStyles}>{load.value.name}</h3>
          {load.value.goals.length > 0 && (
            <ul className={goalsStyles}>
              {load.value.goals.map((goal, index) => (
                <li key={goal}>
                  <Badge tone={GOAL_TONES[index % GOAL_TONES.length]}>
                    {goal}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <p className={descriptionStyles}>{load.value.description}</p>
        </>
      )}
    </div>
    <ul className={blockListStyles}>
      {load.isLoading
        ? PLACEHOLDER_BLOCKS.map((block) => (
            <li className={blockItemStyles} key={block}>
              <div className={blockTextStyles}>
                <Skeleton height="0.875rem" width="8rem" />
                <Skeleton height="0.75rem" width="6rem" />
              </div>
            </li>
          ))
        : load.value.blocks.map((block) => (
            <BlockRow block={block} key={block.id} />
          ))}
    </ul>
  </Card>
);

/** One block row: its name over a summary line, linking to the block detail with
 *  the activate control layered on top and a trailing arrow. */
const BlockRow = ({ block }: { block: BlockRowData }) => (
  <li className={blockItemStyles}>
    <div className={blockRowStyles}>
      <Link
        className={blockLinkStyles}
        href={`/programs/${block.versionId}/block/${block.id}`}
      >
        <span className={blockTextStyles}>
          <span className={blockNameStyles} data-block-name="">
            {block.name}
          </span>
          <span className={blockMetaStyles}>{block.meta}</span>
        </span>
      </Link>
      <BlockActionsMenu
        active={block.active}
        blockId={block.id}
        blockName={block.name}
        versionId={block.versionId}
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

// Three placeholder cards, each showing four block rows — a representative fill
// for the grid before the real programs load.
const PLACEHOLDER_CARDS = [0, 1, 2];
const PLACEHOLDER_BLOCKS = [0, 1, 2, 3];

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
  fontFamily: "condensed",
  fontSize: "2xl",
  fontWeight: "bold",
  letterSpacing: "tight",
  lineHeight: "condensed",
});

const descriptionStyles = css({ color: "muted", fontSize: "sm" });

const goalsStyles = wrap({ gap: 1.5, paddingBlockEnd: 0.5 });

// The blocks stack as an unruled list under the header, set off from it by a
// single hairline on the first row.
const blockListStyles = vstack({ alignItems: "stretch", gap: 0 });

// Only the first item carries a rule — the header/list divider — with extra top
// padding to sit the first row off the line rather than flush against it. The
// blocks themselves run together with no dividers between them.
const blockItemStyles = css({
  _first: {
    borderBlockStart: "1px solid {colors.border}",
    paddingBlockStart: 2,
  },
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
