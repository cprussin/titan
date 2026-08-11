import { ClockCounterClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise";
import { css } from "../../../../styled-system/css";
import { hstack, vstack } from "../../../../styled-system/patterns";
import { TopBar } from "../../../components/TopBar";
import { Skeleton } from "../../../ui";

/**
 * Loading state for the history list. Lays out the same two-column ledger of
 * session rows with skeletons in place of each session's name, date, and status
 * badge.
 */
const HistoryLoading = () => (
  <div className={pageStyles}>
    <TopBar icon={<ClockCounterClockwiseIcon size={18} />} title="History" />
    <ul className={listStyles}>
      {ROWS.map((row) => (
        <li className={rowStyles} key={row}>
          <div className={textStyles}>
            <Skeleton height="1rem" width="11rem" />
            <Skeleton height="0.875rem" width="7rem" />
          </div>
          <Skeleton height="1.25rem" radius="full" width="4rem" />
        </li>
      ))}
    </ul>
  </div>
);

export default HistoryLoading;

// Eight placeholder rows fill the two columns before the real sessions load.
const ROWS = [0, 1, 2, 3, 4, 5, 6, 7];

const pageStyles = vstack({ alignItems: "stretch", gap: 4, lg: { gap: 6 } });

const listStyles = css({
  columnGap: 10,
  display: "grid",
  gridTemplateColumns: { base: "1fr", md: "repeat(2, minmax(0, 1fr))" },
  rowGap: 0,
});

const rowStyles = hstack({
  borderBlockEnd: "1px solid {colors.border}",
  gap: 3,
  justifyContent: "space-between",
  marginInline: -2,
  paddingBlock: 3.5,
  paddingInline: 2,
});

const textStyles = vstack({ alignItems: "flex-start", gap: 0.5 });
