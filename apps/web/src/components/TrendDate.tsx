import { css } from "../../styled-system/css";
import { formatCalendarDate } from "../date";

type Props = {
  /** The point currently being read off the trend line, if any. */
  activeIndex?: number | undefined;
  /** A trend series' point dates, oldest-first. */
  dates: readonly string[];
};

/** The caption under a trend column's value: the day the point being read was
 *  logged, falling back to the series' newest point once the reading ends.
 *  Renders nothing for a series with no points. */
export const TrendDate = ({ activeIndex, dates }: Props) => {
  const date =
    (activeIndex === undefined ? undefined : dates.at(activeIndex)) ??
    dates.at(-1);
  return date === undefined ? undefined : (
    <span className={dateStyles}>{formatCalendarDate(date)}</span>
  );
};

const dateStyles = css({
  color: "textTertiary",
  fontSize: "xs",
  fontVariantNumeric: "tabular-nums",
  minInlineSize: 0,
});
