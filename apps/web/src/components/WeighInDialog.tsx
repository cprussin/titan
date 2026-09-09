"use client";

import type { BodyMetric } from "@titan/domain/body-metric";
import { bodyMetricSchema } from "@titan/domain/body-metric";
import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { css } from "../../styled-system/css";
import { vstack } from "../../styled-system/patterns";
import { ModalDialog } from "../ui";
import { BodyWeightForm } from "./BodyWeightForm";
import { WeighInHistory } from "./WeighInHistory";

const historySchema = z.object({ metrics: z.array(bodyMetricSchema) });

/** Read every weigh-in on record, newest first. Parsed at the boundary
 *  (DATA.md); throws on a failed load so the caller surfaces it rather than
 *  showing an empty history the athlete would read as "nothing logged". */
const fetchWeighIns = async (): Promise<readonly BodyMetric[]> => {
  const response = await fetch("/api/body-metrics");
  if (!response.ok) {
    throw new Error(
      `weigh-in history load failed with status ${response.status}`,
    );
  }
  return historySchema.parse(await response.json()).metrics;
};

enum HistoryKind {
  Loading,
  Loaded,
  Failed,
}

const History = {
  Failed: () => ({ kind: HistoryKind.Failed as const }),
  Loaded: (metrics: readonly BodyMetric[]) => ({
    kind: HistoryKind.Loaded as const,
    metrics,
  }),
  Loading: () => ({ kind: HistoryKind.Loading as const }),
};

type History = ReturnType<(typeof History)[keyof typeof History]>;

type Props = {
  /** Reads the weigh-ins on record; injected in tests. */
  loadWeighIns?: typeof fetchWeighIns;
  /** The control that opens the dialog. */
  trigger: ReactElement;
};

/**
 * The app's one weigh-in surface: `trigger` opens a dialog hosting today's
 * entry form over the ledger of weigh-ins already on record, each removable.
 * Every weigh-in affordance wraps it — the dashboard headline's button and the
 * floating action area and sidebar's secondary button — so they all open the
 * same form and the same history.
 *
 * The ledger is read when the dialog opens rather than rendered with the page:
 * the dialog is app-wide chrome, and threading a weigh-in list through the nav
 * and the dashboard alike would make every page pay for a list most visits
 * never see. Saving closes the dialog (so the next open re-reads); a delete
 * re-reads in place.
 */
export const WeighInDialog = ({
  loadWeighIns = fetchWeighIns,
  trigger,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<History>(History.Loading());

  const readHistory = useCallback(() => {
    loadWeighIns()
      .then((metrics) => {
        setHistory(History.Loaded(metrics));
      })
      .catch((error: unknown) => {
        setHistory(History.Failed());
        // biome-ignore lint/suspicious/noConsole: surface a failed history read
        console.error("Failed to load weigh-in history", error);
      });
  }, [loadWeighIns]);

  useEffect(() => {
    if (open) {
      setHistory(History.Loading());
      readHistory();
    }
  }, [open, readHistory]);

  return (
    <ModalDialog
      onOpenChange={setOpen}
      open={open}
      title="Log weigh-in"
      trigger={trigger}
    >
      <div className={bodyStyles}>
        <BodyWeightForm
          onLogged={() => {
            setOpen(false);
          }}
        />
        <section className={historyStyles}>
          <h3 className={headingStyles}>Past weigh-ins</h3>
          {renderHistory(history, readHistory)}
        </section>
      </div>
    </ModalDialog>
  );
};

/** The ledger, or the note that stands in for it while it loads or after a
 *  failed read. */
const renderHistory = (history: History, onDeleted: () => void) => {
  switch (history.kind) {
    case HistoryKind.Loading: {
      return <p className={noteStyles}>Reading your weigh-ins…</p>;
    }
    case HistoryKind.Failed: {
      return <p className={noteStyles}>Couldn’t load your weigh-in history.</p>;
    }
    case HistoryKind.Loaded: {
      return <WeighInHistory metrics={history.metrics} onDeleted={onDeleted} />;
    }
  }
};

const bodyStyles = vstack({ alignItems: "stretch", gap: 5 });

// A hairline rule sets the ledger off from the entry form above it.
const historyStyles = vstack({
  alignItems: "stretch",
  borderBlockStart: "1px solid {colors.border}",
  gap: 2,
  paddingBlockStart: 4,
});

const headingStyles = css({
  color: "muted",
  fontSize: "xs",
  fontWeight: "bold",
  letterSpacing: "wide",
  textTransform: "uppercase",
});

const noteStyles = css({ color: "muted", fontSize: "sm" });
