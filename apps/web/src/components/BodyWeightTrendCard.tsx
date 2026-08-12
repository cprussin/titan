"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent } from "react";
import { useState } from "react";
import { css, cva } from "../../styled-system/css";
import { hstack } from "../../styled-system/patterns";
import { formatBodyWeight } from "../format";
import { Button } from "../ui";
import { Sparkline } from "./Sparkline";

/** Persist a weigh-in. Throws on a failed save so the caller surfaces it rather
 *  than silently dropping the entry. */
export const saveBodyWeight = async (weightLb: number): Promise<void> => {
  const response = await fetch("/api/body-metrics", {
    body: JSON.stringify({ weightLb }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`weigh-in failed with status ${response.status}`);
  }
};

type Props = {
  latestWeightLb: number | undefined;
  /** When the most recent weigh-in was, for the display-mode micro-label. */
  lastWeighInLabel: string | undefined;
  /** Injected for tests; defaults to the real POST. */
  save?: typeof saveBodyWeight;
  series: readonly number[];
  /** Whether today's weigh-in is already logged — hides the entry button. */
  weighedInToday: boolean;
};

/** The trends band's body-weight column, and its weigh-in entry point. In
 *  display mode it reads like the other trend cards, with the value in accent as
 *  the page's one highlighted number. Tapping "Weigh in" swaps only this card
 *  into an inline editor — the numeral becomes the input — so the eye stays in
 *  place; Enter saves, Esc cancels. */
export const BodyWeightTrendCard = ({
  latestWeightLb,
  lastWeighInLabel,
  save = saveBodyWeight,
  series,
  weighedInToday,
}: Props) => {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const startEditing = () => {
    setDraft(latestWeightLb === undefined ? "" : `${latestWeightLb}`);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setBusy(false);
  };

  const commit = () => {
    const weightLb = Number(draft);
    if (Number.isFinite(weightLb) && weightLb > 0) {
      setBusy(true);
      save(weightLb)
        .then(() => {
          setBusy(false);
          setEditing(false);
          router.refresh();
        })
        .catch((error: unknown) => {
          setBusy(false);
          // biome-ignore lint/suspicious/noConsole: surface a weigh-in failure
          console.error("Failed to save weigh-in", error);
        });
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    } else if (event.key === "Escape") {
      cancel();
    }
  };

  return (
    <div className={cardStyles({ editing })}>
      <div className={headerStyles}>
        <span className={labelStyles}>
          {editing ? "Body weight · today" : "Body weight"}
        </span>
        {!editing && !weighedInToday && (
          <Button onClick={startEditing} size="sm" variant="ghost">
            Weigh in
          </Button>
        )}
      </div>

      {editing ? (
        <div className={inputRowStyles}>
          <input
            aria-label="Body weight in pounds"
            className={inputStyles}
            inputMode="decimal"
            onChange={(event) => setDraft(event.currentTarget.value)}
            onKeyDown={onKeyDown}
            step="any"
            type="number"
            value={draft}
          />
          <span className={unitStyles}>lb</span>
        </div>
      ) : (
        <span className={numeralStyles}>
          {latestWeightLb === undefined
            ? "—"
            : formatBodyWeight(latestWeightLb)}
        </span>
      )}

      <Sparkline label="Body weight trend" values={series} />

      {editing ? (
        <div className={actionsStyles}>
          <Button loading={busy} onClick={commit} size="sm" variant="accent">
            Save
          </Button>
          <Button onClick={cancel} size="sm" variant="ghost">
            Cancel
          </Button>
        </div>
      ) : (
        lastWeighInLabel !== undefined && (
          <span className={metaStyles}>Last weigh-in · {lastWeighInLabel}</span>
        )
      )}
    </div>
  );
};

// Flat like its sibling trend cards, until it swaps into entry mode and takes an
// accent border to signal the one editable card. The negative margin lets the
// border grow outward without nudging the layout.
const cardStyles = cva({
  base: {
    alignItems: "stretch",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  variants: {
    editing: {
      false: {},
      true: {
        border: "1px solid {colors.accent}",
        borderRadius: "lg",
        margin: -3,
        padding: 3,
      },
    },
  },
});

const headerStyles = hstack({
  gap: 2,
  justifyContent: "space-between",
  minBlockSize: 8,
});

const labelStyles = css({ color: "muted", fontSize: "sm", minInlineSize: 0 });

// The one highlighted number on the page.
const numeralStyles = css({
  color: "accent",
  fontFamily: "condensed",
  fontSize: "3xl",
  fontVariantNumeric: "tabular-nums",
  fontWeight: "bold",
  lineHeight: "condensed",
});

const inputRowStyles = hstack({ alignItems: "baseline", gap: 2 });

// The numeral, now editable: same condensed figure, ringed in accent.
const inputStyles = css({
  backgroundColor: "card",
  border: "1px solid {colors.accent}",
  borderRadius: "md",
  color: "foreground",
  fontFamily: "condensed",
  fontSize: "3xl",
  fontVariantNumeric: "tabular-nums",
  fontWeight: "bold",
  inlineSize: "7rem",
  lineHeight: "condensed",
  paddingBlock: 1,
  paddingInline: 2,
});

const unitStyles = css({ color: "muted", fontFamily: "mono", fontSize: "sm" });

const actionsStyles = hstack({ gap: 2 });

const metaStyles = css({
  color: "textTertiary",
  fontSize: "xs",
  letterSpacing: "wide",
  textTransform: "uppercase",
});
