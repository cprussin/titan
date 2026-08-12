import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import type { ReactNode } from "react";

import { cva } from "../../styled-system/css";
import { flex } from "../../styled-system/patterns";

/** The toggle-row text size and padding. `md` is the default. */
export const SIZES = ["sm", "md", "lg"] as const;
export type Size = (typeof SIZES)[number];

/** One toggle button: the `value` that identifies it, the `label` shown on it,
 *  and whether it is individually disabled. */
export type ToggleGroupItem<Value extends string> = {
  value: Value;
  label: ReactNode;
  disabled?: boolean | undefined;
};

// Like `Slider`, the props derive from base-ui's generic `Props<Value>` rather
// than the usual `ExtendProps<typeof BaseToggleGroup>` — `ComponentProps` would
// collapse the `<Value extends string>` generic back to `string` and lose the
// typed `value` / `onValueChange`. `children` is stripped because the wrapper
// owns its internal structure (it renders the toggles from `items`), and
// `className` / `render` / `style` are stripped so the wrapper owns its styling.
type Props<Value extends string> = Omit<
  BaseToggleGroup.Props<Value>,
  "children" | "className" | "render" | "style"
> & {
  items: readonly ToggleGroupItem<Value>[];
  size?: Size | undefined;
};

/**
 * A segmented row of toggle buttons — a touch-friendly alternative to a slider
 * or select for picking from a small, fixed set of values. Wraps the
 * `@base-ui/react` ToggleGroup + Toggle primitives, which own the accessible
 * behaviour — `role="group"`, roving focus, arrow-key navigation, the
 * single-vs-multiple selection model, and `aria-pressed` wiring — so this layer
 * only supplies the titan styling: a muted resting button that fills with the
 * accent when pressed. Single-select by default; pass `multiple` for a
 * multi-select group. Every other `ToggleGroup.Root` prop (`value`,
 * `defaultValue`, `onValueChange`, `disabled`, …) passes through, and the group
 * should be named by the caller via `aria-label` / `aria-labelledby`.
 */
export const ToggleGroup = <Value extends string>({
  items,
  size = "md",
  ...props
}: Props<Value>) => (
  <BaseToggleGroup<Value> className={rootStyles} {...props}>
    {items.map((item) => (
      <BaseToggle<Value>
        className={toggleStyles({ size })}
        disabled={item.disabled ?? false}
        key={item.value}
        value={item.value}
      >
        {item.label}
      </BaseToggle>
    ))}
  </BaseToggleGroup>
);

// Wraps onto a second row rather than shrinking the buttons below a comfortable
// tap target — the point of the control on narrow phone screens.
const rootStyles = flex({ direction: "row", gap: 1.5, wrap: "wrap" });

const toggleStyles = cva({
  base: {
    _disabled: {
      cursor: "not-allowed",
      opacity: "disabled",
    },
    // Hover only lifts unpressed, enabled toggles; a pressed one keeps its
    // accent fill.
    "&:not([data-pressed])": {
      _hoverEnabled: {
        backgroundColor: "card",
        borderColor: "borderStrong",
        color: "foreground",
      },
    },
    // Pressed: fill with the accent. `background`-on-`accent` text with a
    // heavier stroke, matching the Button `accent` variant.
    "&[data-pressed]": {
      backgroundColor: "accent",
      borderColor: "accent",
      color: "background",
      fontWeight: "semibold",
    },
    alignItems: "center",
    backgroundColor: "transparent",
    border: "1px solid {colors.border}",
    borderRadius: "md",
    color: "muted",
    cursor: "pointer",
    display: "inline-flex",
    // Equal-width segments that grow to fill the row and wrap when they'd fall
    // below `minInlineSize`.
    flex: "1 1 auto",
    fontVariantNumeric: "tabular-nums",
    fontWeight: "medium",
    justifyContent: "center",
    minInlineSize: 10,
    transition:
      "color {durations.fast} {easings.out}, background-color {durations.fast} {easings.out}, border-color {durations.fast} {easings.out}",
  },
  variants: {
    size: {
      lg: {
        fontSize: "md",
        minBlockSize: 12,
        paddingBlock: 2,
        paddingInline: 4,
      },
      md: {
        fontSize: "sm",
        minBlockSize: 10,
        paddingBlock: 1.5,
        paddingInline: 3,
      },
      sm: {
        fontSize: "xs",
        minBlockSize: 8,
        paddingBlock: 1,
        paddingInline: 2.5,
      },
    },
  },
});
