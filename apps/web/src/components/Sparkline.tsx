"use client";

import type { PointerEvent } from "react";
import { css } from "../../styled-system/css";

type Props = {
  /** The point currently being read, marked with a guide line. */
  activeIndex?: number | undefined;
  label: string;
  /** Reports the point a pointer lands on — hovered with a mouse, tapped with a
   *  finger — and `undefined` once a mouse leaves the chart. A tap holds its
   *  reading after the finger lifts, since there is no hover to fall back to.
   *  Omit for a static line. */
  onActiveIndexChange?: ((index: number | undefined) => void) | undefined;
  values: readonly number[];
};

/** A minimal, dependency-free SVG trend line. Renders a placeholder until at
 *  least two points exist. Given `onActiveIndexChange` it also carries a band of
 *  invisible hit targets, one per point, so the reader can pick a point out of
 *  the line; the picked point is theirs to render. */
export const Sparkline = ({
  activeIndex,
  label,
  onActiveIndexChange,
  values,
}: Props) => {
  if (values.length < 2) {
    return <div className={emptyStyles}>Not enough data yet</div>;
  } else {
    const plotted = plot(values);
    const active =
      activeIndex === undefined ? undefined : plotted.at(activeIndex);
    return (
      <svg
        aria-label={label}
        className={svgStyles}
        onPointerLeave={(event: PointerEvent<SVGSVGElement>) => {
          if (event.pointerType === "mouse") {
            onActiveIndexChange?.(undefined);
          }
        }}
        preserveAspectRatio="none"
        role="img"
        viewBox="0 0 100 100"
      >
        {active !== undefined && (
          <line
            className={guideStyles}
            data-sparkline-guide=""
            stroke="currentColor"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            x1={active.x}
            x2={active.x}
            y1={0}
            y2={100}
          />
        )}
        <polyline
          fill="none"
          points={plotted.map(({ x, y }) => `${x},${y}`).join(" ")}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
        {onActiveIndexChange !== undefined &&
          plotted.map(({ bandEnd, bandStart, x }, index) => (
            <rect
              data-sparkline-point=""
              fill="transparent"
              height={100}
              key={x}
              onPointerEnter={() => {
                onActiveIndexChange(index);
              }}
              width={bandEnd - bandStart}
              x={bandStart}
              y={0}
            />
          ))}
      </svg>
    );
  }
};

type PlottedPoint = {
  /** The hit band around the point, in viewBox units — its share of the chart's
   *  width, reaching halfway to each neighbour. */
  bandEnd: number;
  bandStart: number;
  x: number;
  y: number;
};

/** Lay the series out across the 100×100 viewBox: evenly spaced along x, scaled
 *  to the series' own span along y (a flat series sits on the bottom edge). */
const plot = (values: readonly number[]): readonly PlottedPoint[] => {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = 100 / (values.length - 1);
  return values.map((value, position) => {
    const x = position * step;
    return {
      bandEnd: Math.min(100, x + step / 2),
      bandStart: Math.max(0, x - step / 2),
      x,
      y: 100 - ((value - min) / range) * 100,
    };
  });
};

const svgStyles = css({
  blockSize: 16,
  color: "accent",
  inlineSize: "100%",
  lg: { blockSize: 28 },
});

// The guide sits behind the reading it explains, so it reads as a rule rather
// than a second trend line.
const guideStyles = css({ color: "borderStrong" });

const emptyStyles = css({
  alignItems: "center",
  blockSize: 16,
  color: "textTertiary",
  display: "flex",
  fontSize: "sm",
  lg: { blockSize: 28 },
});
