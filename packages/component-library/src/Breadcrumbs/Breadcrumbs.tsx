"use client";

import { Popover } from "@base-ui/react/popover";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { DotsThreeIcon } from "@phosphor-icons/react/dist/ssr/DotsThree";
import type { MouseEventHandler } from "react";
import { Fragment, useRef, useState } from "react";
import { css } from "../../styled-system/css";
import { Button } from "../Button/Button";
import { useLink } from "../LinkProvider/LinkProvider";

/** One breadcrumb: the ancestor `label` and, when it has a page of its own, the
 *  `href` it links back to. A crumb with no `href` renders as plain text — for
 *  an ancestor that names a level of the hierarchy but has no page to open. */
export type Crumb = {
  href?: string | undefined;
  label: string;
};

type Props = {
  crumbs: readonly Crumb[];
};

/**
 * A trail of ancestor links, each followed by a caret separator, for a page
 * title path. Links route through the app's {@link LinkProvider} (a plain `<a>`
 * by default). The trailing caret leads into whatever the consumer renders
 * after it — typically the current page's title.
 *
 * The full inline trail can't shrink — every crumb is `nowrap` — so on a narrow
 * viewport it would run off the edge of a tight header. Two presentations are
 * therefore rendered and toggled by breakpoint: from `md` up, the inline trail;
 * below `md`, a single overflow button (`…`) that opens the same ancestors in a
 * popover menu, so the path stays reachable on a phone without crowding the
 * title. Both end in a caret leading into the title.
 */
export const Breadcrumbs = ({ crumbs }: Props) => {
  const Link = useLink();
  return (
    <>
      <span className={trailStyles} data-breadcrumb-trail="">
        {crumbs.map((crumb) => (
          <Fragment key={crumb.label}>
            {crumb.href === undefined ? (
              <span className={plainStyles}>{crumb.label}</span>
            ) : (
              <Link className={linkStyles} href={crumb.href}>
                {crumb.label}
              </Link>
            )}
            <CaretRightIcon className={separatorStyles} size={12} />
          </Fragment>
        ))}
      </span>
      {crumbs.length > 0 && (
        <span className={collapsedStyles}>
          <CollapsedTrail crumbs={crumbs} />
          <CaretRightIcon className={separatorStyles} size={12} />
        </span>
      )}
    </>
  );
};

/**
 * The narrow-screen presentation: an overflow button that opens the ancestors
 * as a popover menu. The menu items are ordinary {@link LinkProvider} links, so
 * navigation routes through the app's router exactly like the inline trail;
 * the popover is controlled only so a client-side navigation dismisses it.
 */
const CollapsedTrail = ({ crumbs }: Props) => {
  const Link = useLink();
  const [open, setOpen] = useState(false);
  // Anchor the popover to a span we own the ref of, rather than to the trigger
  // directly: the library `Button` claims its own ref for internal use, so a
  // ref base-ui set on it would be dropped and the popover would have nothing
  // to position against. The span hugs the button, so anchoring to it lands the
  // menu under the button exactly as anchoring to the button would.
  const anchorRef = useRef<HTMLSpanElement>(null);
  // Dismiss the popover once a link inside it is activated — a client-side
  // navigation swaps the page under an open popover otherwise. The links are
  // natively keyboard-activatable, so an Enter press dispatches the same click
  // that this delegated handler sees; there is no separate key handler to add.
  const dismissOnLinkActivation: MouseEventHandler<HTMLElement> = (event) => {
    if (event.target instanceof Element && event.target.closest("a") !== null) {
      setOpen(false);
    }
  };
  return (
    <Popover.Root onOpenChange={setOpen} open={open}>
      <span className={anchorStyles} ref={anchorRef}>
        <Popover.Trigger
          render={
            <Button label="Show breadcrumbs" size="xs" variant="ghost">
              <DotsThreeIcon size={18} weight="bold" />
            </Button>
          }
        />
      </span>
      <Popover.Portal>
        <Popover.Positioner
          align="start"
          anchor={anchorRef}
          className={positionerStyles}
          side="bottom"
          sideOffset={6}
        >
          <Popover.Popup
            className={popupStyles}
            onClick={dismissOnLinkActivation}
          >
            <nav aria-label="Breadcrumbs" className={menuStyles}>
              {crumbs.map((crumb) =>
                crumb.href === undefined ? (
                  <span className={menuPlainStyles} key={crumb.label}>
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    className={menuLinkStyles}
                    href={crumb.href}
                    key={crumb.label}
                  >
                    {crumb.label}
                  </Link>
                ),
              )}
            </nav>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
};

// The inline trail rides one wrapper that is transparent to layout (`display:
// contents`) at `md` and up, so its links and carets sit directly in the parent
// header row, spaced by that row's own gap. Below `md` it is removed in favor
// of the collapsed overflow menu.
const trailStyles = css({
  display: { base: "none", md: "contents" },
});

// The mirror of `trailStyles`: the overflow button and its trailing caret show
// only below `md`, where the inline trail would overrun the header.
const collapsedStyles = css({
  alignItems: "center",
  display: { base: "inline-flex", md: "none" },
  gap: 1.5,
});

const linkStyles = css({
  _hover: { color: "foreground" },
  color: "muted",
  flexShrink: 0,
  fontSize: "sm",
  fontWeight: "medium",
  transition: "color {durations.fast} {easings.out}",
});

// A crumb with no page of its own: same weight as a link but static — no hover
// affordance, since there's nothing to open.
const plainStyles = css({
  color: "muted",
  flexShrink: 0,
  fontSize: "sm",
  fontWeight: "medium",
});

const separatorStyles = css({ color: "textTertiary", flexShrink: 0 });

// Wraps the trigger button snugly so it can serve as the popover's anchor (see
// the anchorRef note above). Inline-flex keeps it sized to the button.
const anchorStyles = css({
  alignItems: "center",
  display: "inline-flex",
});

const positionerStyles = css({
  outlineStyle: "none",
  zIndex: "modal",
});

const popupStyles = css({
  "&[data-ending-style]": {
    opacity: 0,
    transform: "scaleY(0.9)",
    transition:
      "opacity {durations.fast} {easings.in}, transform {durations.fast} {easings.in}",
  },
  "&[data-starting-style]": {
    opacity: 0,
    transform: "scaleY(0.9)",
  },
  backgroundColor: "card",
  border: "1px solid {colors.border}",
  borderRadius: "md",
  boxShadow: "lifted",
  minInlineSize: "{spacing.44}",
  opacity: 1,
  paddingBlock: 1.5,
  transform: "scaleY(1)",
  transformOrigin: "top",
  transition:
    "opacity {durations.normal} {easings.out}, transform {durations.normal} {easings.out}",
});

const menuStyles = css({
  display: "flex",
  flexDirection: "column",
});

const menuLinkStyles = css({
  _pointerCoarse: { fontSize: "md", paddingBlock: 3 },
  backgroundColor: {
    _hover: "color-mix(in oklab, {colors.foreground} 8%, transparent)",
    base: "transparent",
  },
  color: { _hover: "foreground", base: "muted" },
  fontSize: "sm",
  fontWeight: "medium",
  paddingBlock: 2,
  paddingInline: 3,
  transition: "color {durations.fast} {easings.out}",
});

// A non-navigable crumb inside the menu: the same layout as a link but static,
// dimmer, and with no hover affordance.
const menuPlainStyles = css({
  _pointerCoarse: { fontSize: "md", paddingBlock: 3 },
  color: "textTertiary",
  fontSize: "sm",
  fontWeight: "medium",
  paddingBlock: 2,
  paddingInline: 3,
});
