"use client";

import { useState } from "react";
import { css } from "../../styled-system/css";
import { formatBodyWeight } from "../format";
import { Sparkline } from "./Sparkline";
import { TrendDate } from "./TrendDate";

type Props = {
  /** The `YYYY-MM-DD` day of each weigh-in in `series`, oldest-first. */
  dates: readonly string[];
  latestWeightLb: number | undefined;
  series: readonly number[];
};

/** The trends band's body-weight column — its value the page's one accent
 *  number, which follows the point being read off the trend line and falls back
 *  to the latest weigh-in. Its parts are the column's own children, so it lays
 *  out exactly like the sibling trend columns. */
export const BodyWeightTrendCard = ({
  dates,
  latestWeightLb,
  series,
}: Props) => {
  const [activeIndex, setActiveIndex] = useState<number>();
  const shownWeightLb =
    (activeIndex === undefined ? undefined : series.at(activeIndex)) ??
    latestWeightLb;

  return (
    <>
      <span className={labelStyles}>Body weight</span>

      <span className={numeralStyles}>
        {shownWeightLb === undefined ? "—" : formatBodyWeight(shownWeightLb)}
      </span>

      <TrendDate activeIndex={activeIndex} dates={dates} />

      <Sparkline
        activeIndex={activeIndex}
        label="Body weight trend"
        onActiveIndexChange={setActiveIndex}
        values={series}
      />
    </>
  );
};

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
