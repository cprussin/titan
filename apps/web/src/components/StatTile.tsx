import { css, cva } from "../../styled-system/css";
import type { Tone } from "../ui";

type Props = {
  hint?: string | undefined;
  label: string;
  /** Colors the value to make one stat the focal point of a row. Defaults to
   *  the plain foreground. */
  tone?: Tone | undefined;
  value: string;
};

/** A compact labeled statistic for summary rows. Flat by design (no box) and
 *  server-safe (no hooks). */
export const StatTile = ({ hint, label, tone = "neutral", value }: Props) => (
  <div className={tileStyles}>
    <span className={valueStyles({ tone })}>{value}</span>
    <span className={labelStyles}>{label}</span>
    {hint !== undefined && <span className={hintStyles}>{hint}</span>}
  </div>
);

// Flat by design: no box, just a value over its label. Grouping and separation
// come from the containing stat row, not from a border around each tile.
const tileStyles = css({
  alignItems: "flex-start",
  display: "flex",
  flexDirection: "column",
  gap: 0.5,
});

const labelStyles = css({
  color: "muted",
  fontSize: "xs",
  fontWeight: "medium",
  letterSpacing: "wide",
  textTransform: "uppercase",
});

const valueStyles = cva({
  base: {
    fontSize: "2xl",
    fontVariantNumeric: "tabular-nums",
    fontWeight: "bold",
    letterSpacing: "tight",
    lg: { fontSize: "3xl" },
    lineHeight: "tight",
  },
  variants: {
    tone: {
      accent: { color: "accent" },
      danger: { color: "danger" },
      neutral: { color: "foreground" },
      success: { color: "success" },
      warning: { color: "warning" },
    },
  },
});

const hintStyles = css({
  color: "textTertiary",
  fontSize: "xs",
  fontVariantNumeric: "tabular-nums",
});
