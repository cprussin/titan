import { ClockCounterClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise";
import Link from "next/link";
import { css } from "../../styled-system/css";
import { hstack, vstack } from "../../styled-system/patterns";
import type { Loadable } from "../loadable";
import type { Tone } from "../ui";
import { Badge, Skeleton } from "../ui";
import { TopBar } from "./TopBar";

export type HistoryRow = {
  badge: { text: string; tone: Tone };
  href: string;
  id: string;
  meta: string;
  name: string;
};

export type HistoryData = {
  rows: readonly HistoryRow[];
};

type Props = {
  load: Loadable<HistoryData>;
};

/** The history page and its loading fallback, sharing one tree: a two-column
 *  ledger of session rows. While loading, a representative run of placeholder
 *  rows fills the same ledger; each real row resolves its name, date, and status
 *  badge at the leaves. */
export const HistoryContent = ({ load }: Props) => (
  <div className={pageStyles}>
    <TopBar icon={<ClockCounterClockwiseIcon size={18} />} title="History" />
    <HistoryList load={load} />
  </div>
);

/** The ledger itself: placeholder rows while loading, the empty note when there
 *  are no sessions, else a row per logged session. */
const HistoryList = ({ load }: Props) => {
  if (load.isLoading) {
    return (
      <ul className={listStyles}>
        {PLACEHOLDER_ROWS.map((row) => (
          <HistoryRowItem key={row} load={{ isLoading: true }} />
        ))}
      </ul>
    );
  }
  return load.value.rows.length === 0 ? (
    <p className={mutedStyles}>No sessions yet — start today's workout.</p>
  ) : (
    <ul className={listStyles}>
      {load.value.rows.map((row) => (
        <HistoryRowItem key={row.id} load={{ isLoading: false, value: row }} />
      ))}
    </ul>
  );
};

/** One session row: its name, date-and-week line, and status badge, linking to
 *  the session — a pair of skeleton lines and a badge stand-in while loading. */
const HistoryRowItem = ({ load }: { load: Loadable<HistoryRow> }) => (
  <li>
    {load.isLoading ? (
      <div className={rowStyles}>
        <div className={textStyles}>
          <Skeleton height="1rem" width="11rem" />
          <Skeleton height="0.875rem" width="7rem" />
        </div>
        <Skeleton height="1.25rem" radius="full" width="4rem" />
      </div>
    ) : (
      <Link className={rowStyles} href={load.value.href}>
        <div className={textStyles}>
          <span className={nameStyles}>{load.value.name}</span>
          <span className={metaStyles}>{load.value.meta}</span>
        </div>
        <Badge tone={load.value.badge.tone}>{load.value.badge.text}</Badge>
      </Link>
    )}
  </li>
);

// Eight placeholder rows fill the two columns before the real sessions load.
const PLACEHOLDER_ROWS = [0, 1, 2, 3, 4, 5, 6, 7];

const pageStyles = vstack({ alignItems: "stretch", gap: 4, lg: { gap: 6 } });

// Two flat, hairline-ruled lists side by side on wider screens — column gap
// between them, no vertical gap so each column reads as one continuous list.
const listStyles = css({
  columnGap: 10,
  display: "grid",
  gridTemplateColumns: { base: "1fr", md: "repeat(2, minmax(0, 1fr))" },
  rowGap: 0,
});

const rowStyles = hstack({
  // Hover only for a mouse-like pointer, so a tap on touch doesn't leave a
  // lingering tint. The negative inline margin lets the tint bleed to the row
  // edges while the hairline stays aligned to the text.
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

const textStyles = vstack({ alignItems: "flex-start", gap: 0.5 });

const nameStyles = css({ fontWeight: "medium" });

const metaStyles = css({
  color: "muted",
  fontSize: "sm",
  fontVariantNumeric: "tabular-nums",
});

const mutedStyles = css({ color: "muted" });
