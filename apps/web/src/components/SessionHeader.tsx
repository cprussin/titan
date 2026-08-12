import { css } from "../../styled-system/css";
import { hstack } from "../../styled-system/patterns";

type Props = {
  /** "Today's session" / "Logged session" / "Projected session". */
  label: string;
  summary: string;
};

/** The session block's header line: which session this is, and its one-line
 *  summary, above the grid. */
export const SessionHeader = ({ label, summary }: Props) => (
  <div className={rowStyles}>
    <span className={labelStyles}>{label}</span>
    <span className={summaryStyles}>{summary}</span>
  </div>
);

const rowStyles = hstack({
  alignItems: "baseline",
  columnGap: 3,
  flexWrap: "wrap",
  paddingBlockEnd: 3,
  rowGap: 1,
});

const labelStyles = css({
  color: "textTertiary",
  fontSize: "xs",
  fontWeight: "bold",
  letterSpacing: "wide",
  textTransform: "uppercase",
});

const summaryStyles = css({
  color: "muted",
  fontFamily: "mono",
  fontSize: "sm",
  fontVariantNumeric: "tabular-nums",
});
