import type { CSSProperties } from "react";

import { cva } from "../../styled-system/css";

export const SKELETON_RADII = ["sm", "md", "lg", "full"] as const;
export type SkeletonRadius = (typeof SKELETON_RADII)[number];

type Props = {
  /** Block size (height) as a CSS length, e.g. `"1rem"`. Omit to let the
   *  surrounding layout set the height (the default 1-line height applies when
   *  nothing else constrains it). */
  height?: string | undefined;
  /** Corner rounding. Defaults to `sm`; use `full` for circles and pills. */
  radius?: SkeletonRadius | undefined;
  /** Inline size (width) as a CSS length, e.g. `"60%"` or `"8rem"`. Omit to
   *  fill the container. */
  width?: string | undefined;
};

/**
 * A pulsing placeholder block that stands in for content while a page loads.
 * Skeletons let a loading screen render the real page's full layout — headings,
 * cards, list rows — with these blocks where the dynamic data will land, so the
 * transition to loaded doesn't shift anything.
 *
 * Dimensions are per-instance layout data, not design variants, so `width` and
 * `height` are applied as inline sizes rather than enumerated tokens (Panda
 * can't statically extract runtime values). Everything else — the fill color,
 * the pulse animation, the corner rounding — resolves through tokens.
 */
export const Skeleton = ({ height, radius = "sm", width }: Props) => (
  <span
    aria-hidden
    className={skeletonStyles({ radius })}
    data-skeleton=""
    style={sizeStyle(width, height)}
  />
);

// Only emit the inline properties that are actually set, so an omitted
// dimension falls through to the CSS default rather than to an empty override.
const sizeStyle = (
  width: string | undefined,
  height: string | undefined,
): CSSProperties => ({
  ...(width === undefined ? {} : { inlineSize: width }),
  ...(height === undefined ? {} : { blockSize: height }),
});

const skeletonStyles = cva({
  base: {
    animation: "pulse {durations.pulse} {easings.in-out} infinite",
    backgroundColor: "skeleton",
    // A single line of text by default; a `height` prop or a sized container
    // overrides it.
    blockSize: 4,
    display: "block",
    // Never let a flex/grid parent collapse a placeholder to nothing.
    flexShrink: 0,
    inlineSize: "100%",
  },
  variants: {
    radius: {
      full: { borderRadius: "full" },
      lg: { borderRadius: "lg" },
      md: { borderRadius: "md" },
      sm: { borderRadius: "sm" },
    },
  },
});
