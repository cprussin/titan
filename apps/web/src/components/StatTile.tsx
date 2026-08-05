import { css } from "../../styled-system/css";
import { vstack } from "../../styled-system/patterns";

type Props = {
  hint?: string | undefined;
  label: string;
  value: string;
};

/** A compact labeled statistic for the dashboard and analytics grids. Purely
 *  presentational and server-safe (no hooks). */
export const StatTile = ({ hint, label, value }: Props) => (
  <div className={tileStyles}>
    <span className={valueStyles}>{value}</span>
    <span className={labelStyles}>{label}</span>
    {hint !== undefined && <span className={hintStyles}>{hint}</span>}
  </div>
);

// Flat by design: no box, just a value over its label. Grouping and separation
// come from the containing stat row, not from a border around each tile.
const tileStyles = vstack({
  alignItems: "flex-start",
  gap: 0.5,
});

const labelStyles = css({
  color: "muted",
  fontSize: "xs",
  fontWeight: "medium",
  letterSpacing: "wide",
  textTransform: "uppercase",
});

const valueStyles = css({
  color: "foreground",
  fontSize: "2xl",
  fontVariantNumeric: "tabular-nums",
  fontWeight: "bold",
  letterSpacing: "tight",
  lg: { fontSize: "3xl" },
  lineHeight: "tight",
});

const hintStyles = css({
  color: "textTertiary",
  fontSize: "xs",
  fontVariantNumeric: "tabular-nums",
});
