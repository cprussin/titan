import { BarbellIcon } from "@phosphor-icons/react/dist/ssr/Barbell";
import { css } from "../../../../styled-system/css";
import { vstack, wrap } from "../../../../styled-system/patterns";
import { TopBar } from "../../../components/TopBar";
import { Card, Skeleton } from "../../../ui";

/**
 * Loading state for the programs explorer. Fills the same auto-filling grid with
 * program-card skeletons — each a header (name, goal tags, description) over a
 * ledger of block rows — so the cards don't jump when the real programs load.
 */
const ProgramsLoading = () => (
  <div className={pageStyles}>
    <TopBar icon={<BarbellIcon size={18} />} title="Programs" />
    <div className={gridStyles}>
      {CARDS.map((card) => (
        <Card key={card}>
          <div className={headerStyles}>
            <div className={goalsStyles}>
              <Skeleton height="1.25rem" radius="full" width="4rem" />
              <Skeleton height="1.25rem" radius="full" width="5rem" />
            </div>
            <Skeleton height="1.75rem" radius="md" width="12rem" />
            <Skeleton height="0.875rem" width="100%" />
          </div>
          <ul className={blockListStyles}>
            {BLOCK_ROWS.map((row) => (
              <li className={blockItemStyles} key={row}>
                <div className={blockTextStyles}>
                  <Skeleton height="0.875rem" width="8rem" />
                  <Skeleton height="0.75rem" width="6rem" />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  </div>
);

export default ProgramsLoading;

// Three cards, each showing four block rows — a representative fill for the grid.
const CARDS = [0, 1, 2];
const BLOCK_ROWS = [0, 1, 2, 3];

const pageStyles = vstack({ alignItems: "stretch", gap: 6 });

const gridStyles = css({
  alignItems: "start",
  display: "grid",
  gap: 4,
  gridTemplateColumns: "repeat(auto-fill, minmax(20rem, 1fr))",
});

const headerStyles = vstack({ alignItems: "flex-start", gap: 1 });

const goalsStyles = wrap({ gap: 1.5, paddingBlockEnd: 0.5 });

const blockListStyles = vstack({ alignItems: "stretch", gap: 0 });

const blockItemStyles = css({
  _first: { paddingBlockStart: 2 },
  borderBlockStart: "1px solid {colors.border}",
  paddingBlock: 2,
});

const blockTextStyles = vstack({ alignItems: "flex-start", gap: 0.5 });
