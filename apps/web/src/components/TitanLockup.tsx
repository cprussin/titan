import { css, cva } from "../../styled-system/css";
import { hstack, vstack } from "../../styled-system/patterns";
import { TitanMark } from "./TitanMark";

type Orientation = "horizontal" | "stacked";

type Props = {
  /**
   * `horizontal` (default) sets the mark beside the wordmark for app chrome;
   * `stacked` sets it above for the larger sign-in / splash lockup.
   */
  orientation?: Orientation | undefined;
};

// The mark's edge length per orientation. The wordmark's cap height is sized to
// track it (see `wordmarkStyles`), and the lockup gap is ~40% of it.
const MARK_SIZE: Record<Orientation, number> = {
  horizontal: 20,
  stacked: 96,
};

/**
 * The Titan brand lockup: "The Monolith" mark paired with the `TITAN` wordmark
 * as live text, vertically centered. The wordmark carries the accessible name;
 * the mark is decorative. A `span` root so the lockup nests inside a heading
 * where one is wanted (e.g. the sign-in screen).
 */
export const TitanLockup = ({ orientation = "horizontal" }: Props) => (
  <span className={lockupStyles({ orientation })}>
    <TitanMark size={MARK_SIZE[orientation]} />
    <span className={wordmarkStyles({ orientation })}>TITAN</span>
  </span>
);

const lockupStyles = cva({
  base: css.raw({ color: "foreground" }),
  variants: {
    orientation: {
      horizontal: hstack.raw({ gap: 2 }),
      stacked: { ...vstack.raw({ gap: 9.5 }), alignItems: "flex-start" },
    },
  },
});

// Barlow Condensed 700, tracked in slightly (the spec's -0.01em maps to the
// nearest negative token). The cap height tracks the mark: `3xl` beside the
// 20px chrome mark, `8xl` above the 96px splash mark.
const wordmarkStyles = cva({
  base: {
    fontFamily: "condensed",
    fontWeight: "bold",
    letterSpacing: "tight",
    lineHeight: "condensed",
  },
  variants: {
    orientation: {
      horizontal: { fontSize: "3xl" },
      stacked: { fontSize: "8xl" },
    },
  },
});
