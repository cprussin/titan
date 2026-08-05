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
    <span className={labelStyles}>{label}</span>
    <span className={valueStyles}>{value}</span>
    {hint !== undefined && <span className={hintStyles}>{hint}</span>}
  </div>
);

const tileStyles = vstack({
  alignItems: "flex-start",
  backgroundColor: "card",
  border: "1px solid {colors.border}",
  borderRadius: "xl",
  gap: 1.5,
  lg: { padding: 5 },
  padding: 4,
});

const labelStyles = css({
  color: "muted",
  fontSize: "xs",
  fontWeight: "semibold",
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
