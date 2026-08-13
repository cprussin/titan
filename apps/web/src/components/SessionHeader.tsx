import { css } from "../../styled-system/css";
import { hstack } from "../../styled-system/patterns";
import type { Loadable } from "../loadable";
import { Skeleton } from "../ui";

export type SessionHeaderData = {
  /** "Today's session" / "Logged session" / "Projected session". */
  label: string;
  summary: string;
};

type Props = {
  load: Loadable<SessionHeaderData>;
};

/** The session block's header line: which session this is, and its one-line
 *  summary, above the grid. While loading, the label and summary stand in as
 *  skeletons so the header holds its place. */
export const SessionHeader = ({ load }: Props) => (
  <div className={rowStyles}>
    {load.isLoading ? (
      <Skeleton height="0.75rem" width="7rem" />
    ) : (
      <span className={labelStyles}>{load.value.label}</span>
    )}
    {load.isLoading ? (
      <Skeleton height="0.875rem" width="18rem" />
    ) : (
      <span className={summaryStyles}>{load.value.summary}</span>
    )}
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
