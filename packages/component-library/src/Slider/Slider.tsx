import { Slider as BaseSlider } from "@base-ui/react/slider";
import { css } from "../../styled-system/css";

// Single-value only: the RPE/effort sliders this wraps carry one thumb, so the
// API narrows base-ui's `number | readonly number[]` value to a plain `number`
// (`Root.Props<number>`) and callers get a `number` back from `onValueChange`.
// This is why the props derive from `Root.Props<number>` rather than the usual
// `ExtendProps<typeof BaseSlider.Root>` — `ComponentProps` would collapse the
// generic back to the union and lose the single-number ergonomics. `className`
// and `style` are stripped so the wrapper owns its styling; `render` and
// `children` are stripped so it owns its internal Control/Track/Thumb structure.
type Props = Omit<
  BaseSlider.Root.Props<number>,
  "children" | "className" | "render" | "style"
> & {
  "aria-label"?: string | undefined;
};

/**
 * A horizontal slider that wraps the `@base-ui/react` Slider primitive with the
 * design tokens and an ergonomic single-thumb API. Interaction — dragging,
 * keyboard stepping, track presses — is handled by base-ui; the wrapper only
 * supplies styling and forwards `aria-label` to the thumb so the control is
 * named.
 */
export const Slider = ({ "aria-label": ariaLabel, ...props }: Props) => (
  <BaseSlider.Root className={rootStyles} {...props}>
    <BaseSlider.Control className={controlStyles}>
      <BaseSlider.Track className={trackStyles}>
        <BaseSlider.Indicator className={indicatorStyles} />
        <BaseSlider.Thumb aria-label={ariaLabel} className={thumbStyles} />
      </BaseSlider.Track>
    </BaseSlider.Control>
  </BaseSlider.Root>
);

const rootStyles = css({ inlineSize: "100%" });

// The full-height hit area so a press anywhere along the row seeks the value,
// while the visible rail stays thin.
const controlStyles = css({
  alignItems: "center",
  blockSize: 6,
  cursor: { _disabled: "not-allowed", base: "pointer" },
  display: "flex",
  inlineSize: "100%",
  opacity: { _disabled: "disabled" },
});

const trackStyles = css({
  backgroundColor: "border",
  blockSize: 1.5,
  borderRadius: "full",
  inlineSize: "100%",
});

const indicatorStyles = css({
  backgroundColor: "accent",
  borderRadius: "full",
});

const thumbStyles = css({
  "&:has(:focus-visible)": {
    boxShadow:
      "0 0 0 {spacing.1} color-mix(in oklab, {colors.accent} 35%, transparent)",
  },
  backgroundColor: "accent",
  blockSize: 4,
  borderRadius: "full",
  inlineSize: 4,
  transition: "box-shadow {durations.fast} {easings.default}",
});
