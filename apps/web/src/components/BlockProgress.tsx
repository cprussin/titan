import { cva } from "../../styled-system/css";
import { hstack } from "../../styled-system/patterns";
import type { WeekState } from "../block-weeks";

type Props = {
  weeks: readonly WeekState[];
};

/** A compact week-by-week progress track for the current training block: one
 *  equal segment per week, filled through the current week and faint beyond it.
 *  Decorative — the "Week X of Y" caption already states the position for
 *  assistive tech — so the track is hidden from the accessibility tree. */
export const BlockProgress = ({ weeks }: Props) => (
  <div aria-hidden="true" className={trackStyles}>
    {weeks.map((state, index) => (
      // Segments are positional and never reorder, so the index is a stable key.
      <span className={segmentStyles({ state })} key={index} />
    ))}
  </div>
);

const trackStyles = hstack({ gap: 1 });

const segmentStyles = cva({
  base: {
    blockSize: 1,
    borderRadius: "full",
    flex: 1,
  },
  variants: {
    state: {
      complete: {
        backgroundColor:
          "color-mix(in oklab, {colors.accent} 55%, transparent)",
      },
      current: { backgroundColor: "accent" },
      upcoming: { backgroundColor: "border" },
    },
  },
});
