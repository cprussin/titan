"use client";

import { ClockCounterClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise";
import type { BodyMetric } from "@titan/domain/body-metric";
import { css } from "../../styled-system/css";
import { hstack } from "../../styled-system/patterns";
import { formatWeight } from "../format";
import { Button, ModalDialog } from "../ui";
import { DeleteEntryButton } from "./DeleteEntryButton";

type Props = {
  metrics: readonly BodyMetric[];
};

/** Opens a dialog listing every weigh-in, each removable. */
export const WeighInHistoryButton = ({ metrics }: Props) => (
  <ModalDialog
    title="Weigh-in history"
    trigger={
      <Button
        beforeIcon={<ClockCounterClockwiseIcon />}
        size="sm"
        variant="outline"
      >
        History
      </Button>
    }
  >
    {metrics.length === 0 ? (
      <p className={emptyStyles}>No weigh-ins logged yet.</p>
    ) : (
      <ul className={listStyles}>
        {metrics.map((metric) => (
          <li className={rowStyles} key={metric.id}>
            <span className={dateStyles}>{metric.date}</span>
            <span className={weightStyles}>
              {formatWeight(metric.weightLb)}
            </span>
            <DeleteEntryButton
              endpoint={`/api/history/body-metrics/${metric.id}`}
              itemLabel="weigh-in"
            />
          </li>
        ))}
      </ul>
    )}
  </ModalDialog>
);

const emptyStyles = css({ color: "muted", fontSize: "sm" });

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
