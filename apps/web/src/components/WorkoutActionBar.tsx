import type { ReactNode } from "react";
import { css } from "../../styled-system/css";

type Props = {
  /** The action buttons to seat in the bar. */
  children: ReactNode;
};

/**
 * The primary workout controls, pinned as a bar to the bottom of the screen so
 * they stay under the thumb while the recorded work scrolls above. The workout
 * screen fills the viewport below `lg` (see {@link WorkoutScreenLayout}), so the
 * bar drops all the way to the bottom even when the set content is short, and
 * sticks there while a long set list scrolls behind its opaque fill. Below `lg`
 * the bottom offset clears the phone tab bar (and the OS safe-area inset it
 * honors); through the `mdToLg` drawer window there's no bottom bar so it sits
 * at the edge above the safe area; from `lg` up it pins to the content column's
 * own bottom and lays the buttons out in a row.
 */
export const WorkoutActionBar = ({ children }: Props) => (
  <div className={barStyles}>{children}</div>
);

const barStyles = css({
  backgroundColor: "background",
  borderBlockStart: "1px solid {colors.border}",
  display: "flex",
  flexDirection: "column",
  gap: 3,
  // Lands right on top of AppNav's phone tab bar rather than under it. That bar
  // is `paddingBlockStart 2 + item 14 + paddingBlockEnd max(2, safe-area)` tall,
  // i.e. `max(18, safe-area + 16)` — plus its own 1px `borderBlockStart`, which
  // this band deliberately doesn't count. The bar's bottom edge lands 1px inside
  // the nav as a result, but the bar has no rule on that edge, and the nav paints
  // its hairline over the bar's last pixel of fill from the higher layer
  // (`zIndex` 10 vs 5), so the seam still reads as a single hairline. The workout
  // screen reserves the same band both in its fill height and at the end of its
  // scroll column (see WorkoutScreenLayout) so the pinned and scrolled positions
  // agree — without the latter, the bar would still be pinned a band up at the
  // bottom of the scroll and would sit over content the athlete could no longer
  // reach.
  insetBlockEnd:
    "max({spacing.18}, calc(env(safe-area-inset-bottom) + {spacing.16}))",
  lg: {
    // From `lg` up the screen no longer fills the viewport; the bar pins to the
    // content column's bottom and shares a row where there's width for it.
    "& > *": { flex: 1 },
    flexDirection: "row",
    insetBlockEnd: 0,
    marginBlockStart: 0,
  },
  // Drop to the bottom of the viewport-filling column when the content is short.
  marginBlockStart: "auto",
  md: {
    // The `mdToLg` drawer window carries no bottom bar, so sit at the edge and
    // honor the safe-area inset directly.
    insetBlockEnd: 0,
    paddingBlockEnd: "max({spacing.3}, env(safe-area-inset-bottom))",
  },
  paddingBlockEnd: 3,
  paddingBlockStart: 3,
  position: "sticky",
  zIndex: 5,
});
