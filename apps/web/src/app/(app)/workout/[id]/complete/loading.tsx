import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { css } from "../../../../../../styled-system/css";
import { grid, vstack } from "../../../../../../styled-system/patterns";
import { TopBar } from "../../../../../components/TopBar";
import { Skeleton } from "../../../../../ui";

/**
 * Loading state for the workout summary. Reserves the stat row, the recap
 * section, and the return button with skeletons so the summary settles in place
 * once the session totals and next-session adaptations resolve.
 */
const CompleteLoading = () => (
  <div className={pageStyles}>
    <TopBar
      actions={<Skeleton height="1.75rem" radius="md" width="4rem" />}
      breadcrumbs={[{ href: "/history", label: "History" }]}
      icon={<CheckCircleIcon size={18} />}
      title={<Skeleton height="1rem" width="7rem" />}
    />

    <div className={statGridStyles}>
      {STAT_TILES.map((tile) => (
        <div className={statTileStyles} key={tile}>
          <Skeleton height="1.75rem" radius="md" width="4rem" />
          <Skeleton height="0.75rem" width="4rem" />
        </div>
      ))}
    </div>

    <section className={sectionStyles}>
      <div className={sectionTitleStyles}>
        <Skeleton height="1.125rem" width="8rem" />
      </div>
      <ul className={listStyles}>
        {ROWS.map((row) => (
          <li className={rowStyles} key={row}>
            <div className={rowTextStyles}>
              <Skeleton height="1rem" width="9rem" />
              <Skeleton height="0.875rem" width="14rem" />
            </div>
            <Skeleton height="1.25rem" radius="full" width="5rem" />
          </li>
        ))}
      </ul>
    </section>

    <div className={backStyles}>
      <Skeleton height="2.75rem" radius="md" width="12rem" />
    </div>
  </div>
);

export default CompleteLoading;

const STAT_TILES = [0, 1, 2];
const ROWS = [0, 1, 2];

const pageStyles = vstack({ alignItems: "stretch", gap: 4, lg: { gap: 6 } });

const statGridStyles = grid({ columns: 3, gap: 4, lg: { gap: 8 } });

const statTileStyles = vstack({ alignItems: "flex-start", gap: 0.5 });

const sectionStyles = vstack({ alignItems: "stretch", gap: 3 });

const sectionTitleStyles = css({
  borderBlockEnd:
    "1px solid color-mix(in oklab, {colors.accent} 35%, {colors.border})",
  paddingBlockEnd: 2,
});

const listStyles = vstack({ alignItems: "stretch", gap: 0 });

const rowStyles = css({
  _first: { borderBlockStart: "none", paddingBlockStart: 0 },
  alignItems: "flex-start",
  borderBlockStart: "1px solid {colors.border}",
  display: "flex",
  gap: 3,
  justifyContent: "space-between",
  paddingBlock: 2.5,
});

const rowTextStyles = vstack({ alignItems: "flex-start", gap: 0.5 });

const backStyles = css({ marginBlockStart: 2 });
