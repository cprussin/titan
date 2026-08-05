import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import type { ReactNode } from "react";

import { css } from "../../styled-system/css";
import type { ExtendProps } from "../extend-props";

/** One accordion row: the `value` identifying it, the `trigger` shown in its
 *  always-visible header, and the `content` revealed when it opens. */
export type AccordionItem = {
  value: string;
  trigger: ReactNode;
  content: ReactNode;
  disabled?: boolean | undefined;
};

// `multiple` is defaulted to single-open below; it and every other
// `Accordion.Root` prop (`value`, `defaultValue`, `onValueChange`,
// `keepMounted`, …) still pass through.
type Props = ExtendProps<
  typeof BaseAccordion.Root,
  { items: readonly AccordionItem[] }
>;

/**
 * A vertical stack of disclosure rows. Wraps the `@base-ui/react` Accordion,
 * which owns the accessible behaviour (heading + `button` wiring, arrow-key
 * navigation, open/close state) and — crucially — measures each panel so the
 * collapse animates to the real content height via `--accordion-panel-height`
 * and unmounts the closed panel entirely (no half-open peek). This layer only
 * adds the titan styling: hairline-separated rows, a full-width trigger, and a
 * caret that rotates as its panel opens. Single-open by default; pass
 * `multiple` to allow several at once.
 */
export const Accordion = ({ items, ...props }: Props) => (
  <BaseAccordion.Root className={rootStyles} multiple={false} {...props}>
    {items.map((item) => (
      <BaseAccordion.Item
        className={itemStyles}
        key={item.value}
        value={item.value}
      >
        <BaseAccordion.Header className={headerStyles}>
          <BaseAccordion.Trigger
            className={triggerStyles}
            disabled={item.disabled ?? false}
          >
            <span className={triggerContentStyles}>{item.trigger}</span>
            <span className={caretStyles}>
              <CaretRightIcon size={18} />
            </span>
          </BaseAccordion.Trigger>
        </BaseAccordion.Header>
        <BaseAccordion.Panel className={panelStyles}>
          <div className={panelInnerStyles}>{item.content}</div>
        </BaseAccordion.Panel>
      </BaseAccordion.Item>
    ))}
  </BaseAccordion.Root>
);

const rootStyles = css({
  borderBlockStart: "1px solid {colors.border}",
  display: "flex",
  flexDirection: "column",
});

const itemStyles = css({
  borderBlockEnd: "1px solid {colors.border}",
});

// base-ui renders the header as an <h3>; drop its default margin so the trigger
// fills the row.
const headerStyles = css({ margin: 0 });

const triggerStyles = css({
  _disabled: {
    cursor: "not-allowed",
    opacity: "disabled",
  },
  // Keyboard focus fills the row with a soft accent wash rather than the global
  // square outline, which reads badly across a full-width row.
  _focusVisible: {
    backgroundColor: "color-mix(in oklab, {colors.accent} 12%, transparent)",
    borderRadius: "sm",
    outlineColor: "transparent",
  },
  _hoverEnabled: { color: "foreground" },
  alignItems: "center",
  appearance: "none",
  backgroundColor: "transparent",
  border: "none",
  color: "inherit",
  cursor: "pointer",
  display: "flex",
  fontFamily: "inherit",
  gap: 3,
  inlineSize: "100%",
  justifyContent: "space-between",
  paddingBlock: 4,
  textAlign: "start",
});

const triggerContentStyles = css({ flex: 1, minInlineSize: 0 });

const caretStyles = css({
  // The trigger carries `data-panel-open` while its panel is open.
  "[data-panel-open] &": { transform: "rotate(90deg)" },
  color: "muted",
  display: "flex",
  flexShrink: 0,
  transition: "transform {durations.fast} {easings.out}",
});

// The collapse animation: base-ui measures the content and exposes its height as
// `--accordion-panel-height`; the panel animates between that and 0 on
// enter/exit while clipping its overflow.
const panelStyles = css({
  "&[data-starting-style], &[data-ending-style]": { blockSize: 0 },
  blockSize: "var(--accordion-panel-height)",
  overflow: "hidden",
  transition: "block-size {durations.normal} {easings.out}",
});

const panelInnerStyles = css({ paddingBlockEnd: 5, paddingBlockStart: 1 });
