"use client";

import type { BodyMetric } from "@titan/domain/body-metric";
import { css } from "../../styled-system/css";
import { hstack } from "../../styled-system/patterns";
import { formatCalendarDate } from "../date";
import { formatBodyWeight } from "../format";
import { DeleteEntryButton } from "./DeleteEntryButton";

type Props = {
  /** Every weigh-in on record, newest first. */
  metrics: readonly BodyMetric[];
  /** Called once a weigh-in is removed, so the caller can re-read the list. */
  onDeleted: () => void;
};

/** The weigh-in dialog's ledger: every weigh-in on record, each removable. */
export const WeighInHistory = ({ metrics, onDeleted }: Props) =>
  metrics.length === 0 ? (
    <p className={noteStyles}>No weigh-ins logged yet.</p>
  ) : (
    <ul className={listStyles}>
      {metrics.map((metric) => (
        <li className={rowStyles} key={metric.id}>
          <span className={dateStyles}>{formatCalendarDate(metric.date)}</span>
          <span className={weightStyles}>
            {formatBodyWeight(metric.weightLb)}
          </span>
          <DeleteEntryButton
            endpoint={`/api/history/body-metrics/${metric.id}`}
            itemLabel="weigh-in"
            onDeleted={onDeleted}
          />
        </li>
      ))}
    </ul>
  );

const noteStyles = css({ color: "muted", fontSize: "sm" });

const listStyles = css({ display: "flex", flexDirection: "column" });

const rowStyles = hstack({
  borderBlockEnd: "1px solid {colors.border}",
  gap: 3,
  paddingBlock: 1.5,
});

const dateStyles = css({
  color: "muted",
  flex: 1,
  fontSize: "sm",
  fontVariantNumeric: "tabular-nums",
  minInlineSize: 0,
});

const weightStyles = css({
  fontVariantNumeric: "tabular-nums",
  fontWeight: "medium",
});
