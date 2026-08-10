import { css } from "../../styled-system/css";

type Props = {
  /** Rendered edge length of the (square) mark, in pixels. */
  size: number;
};

/**
 * "The Monolith" — Titan's mark: an accent slab resting on three pillars. The
 * pillars inherit `currentColor` so the mark tracks the surrounding text color
 * across light and dark themes; only the slab is fixed to the accent. Purely
 * decorative — every lockup pairs it with the `TITAN` wordmark as live text —
 * so it is hidden from assistive tech.
 */
export const TitanMark = ({ size }: Props) => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    height={size}
    viewBox="0 0 96 96"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect className={slabStyles} height="14" rx="2" width="72" x="12" y="12" />
    <rect height="54" rx="2" width="14" x="20" y="32" />
    <rect height="54" rx="2" width="14" x="41" y="32" />
    <rect height="54" rx="2" width="14" x="62" y="32" />
  </svg>
);

// The slab is the one fixed element: the brand accent in both themes. In dark
// mode (the app default) this resolves to the canonical `#3D7BFF`.
const slabStyles = css({ fill: "accent" });
