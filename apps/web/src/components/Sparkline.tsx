import { css } from "../../styled-system/css";

type Props = {
  label: string;
  values: readonly number[];
};

/** A minimal, dependency-free SVG trend line. Server-safe. Renders a placeholder
 *  until at least two points exist. */
export const Sparkline = ({ label, values }: Props) => {
  if (values.length < 2) {
    return <div className={emptyStyles}>Not enough data yet</div>;
  } else {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const points = values
      .map((value, position) => {
        const x = (position / (values.length - 1)) * 100;
        const y = 100 - ((value - min) / range) * 100;
        return `${x},${y}`;
      })
      .join(" ");
    return (
      <svg
        aria-label={label}
        className={svgStyles}
        preserveAspectRatio="none"
        role="img"
        viewBox="0 0 100 100"
      >
        <polyline
          fill="none"
          points={points}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }
};

const svgStyles = css({
  blockSize: 16,
  color: "accent",
  inlineSize: "100%",
});

const emptyStyles = css({
  blockSize: 16,
  color: "textTertiary",
  fontSize: "sm",
});
