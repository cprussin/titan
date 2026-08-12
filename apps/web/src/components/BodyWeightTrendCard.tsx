"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent } from "react";
import { useEffect, useState } from "react";
import { css, cva } from "../../styled-system/css";
import { hstack } from "../../styled-system/patterns";
import { formatBodyWeight } from "../format";
import { Button } from "../ui";
import { Sparkline } from "./Sparkline";
import { useWeighIn } from "./WeighInContext";

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
  /** Injected for tests; defaults to the real POST. */
  save?: typeof saveBodyWeight;
  series: readonly number[];
};

/** The trends band's body-weight column — its value the page's one accent
 *  number. It doubles as the weigh-in editor: when the shared weigh-in state is
 *  open (from the headline's "Weigh in" button), the numeral becomes an input,
 *  so the eye stays in place; Enter saves, Esc cancels. */
export const BodyWeightTrendCard = ({
  latestWeightLb,
  save = saveBodyWeight,
  series,
}: Props) => {
  const router = useRouter();
  const { close, weighingIn } = useWeighIn();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  // Seed the input with the last weight each time entry opens.
  useEffect(() => {
    if (weighingIn) {
      setDraft(latestWeightLb === undefined ? "" : `${latestWeightLb}`);
    }
  }, [weighingIn, latestWeightLb]);

  const commit = () => {
    const weightLb = Number(draft);
    if (Number.isFinite(weightLb) && weightLb > 0) {
      setBusy(true);
      save(weightLb)
        .then(() => {
          setBusy(false);
          close();
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
      close();
    }
  };

  return (
    <div className={cardStyles({ editing: weighingIn })}>
      <span className={labelStyles}>
        {weighingIn ? "Body weight · today" : "Body weight"}
      </span>

      {weighingIn ? (
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

      {weighingIn && (
        <div className={actionsStyles}>
          <Button loading={busy} onClick={commit} size="sm" variant="accent">
            Save
          </Button>
          <Button onClick={close} size="sm" variant="ghost">
            Cancel
          </Button>
        </div>
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
