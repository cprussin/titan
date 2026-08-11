import type { ReactNode } from "react";
import { css } from "../../styled-system/css";
import type { Crumb } from "../ui";
import { Breadcrumbs } from "../ui";
import { NavMenuButton } from "./NavMenuButton";

export type { Crumb };

type Props = {
  actions?: ReactNode | undefined;
  breadcrumbs?: readonly Crumb[] | undefined;
  description?: string | undefined;
  icon?: ReactNode | undefined;
  title: ReactNode;
};

/**
 * The static header bar every page opens with, modeled on Linear's: a slim row
 * pinned to the top of the viewport with (in the drawer window) a nav menu
 * button, a section icon, a breadcrumb-and-title path at a small, chrome-sized
 * weight, and a page-wide actions slot ("Cancel workout" and the like) on the
 * end. The description floats muted in the centre. It bleeds to the content
 * edges so its rule runs the full width, and must be a direct child of the
 * page's scroll column so `position: sticky` holds across the whole page.
 */
export const TopBar = ({
  actions,
  breadcrumbs,
  description,
  icon,
  title,
}: Props) => (
  <div className={barStyles}>
    <div className={pathStyles}>
      <NavMenuButton />
      {icon !== undefined && <span className={iconStyles}>{icon}</span>}
      {breadcrumbs !== undefined && <Breadcrumbs crumbs={breadcrumbs} />}
      <h1 className={titleStyles}>{title}</h1>
    </div>
    {description !== undefined && (
      <span className={descriptionStyles}>{description}</span>
    )}
    {actions !== undefined && <div className={actionsStyles}>{actions}</div>}
  </div>
);

// A slim bar pinned to the top of the viewport, bleeding to the content edges
// (negating the main padding) so its background and rule run the full width. As
// a direct child of the page column, it stays pinned for the whole scroll. It's
// the positioned ancestor for the absolutely-centered description.
const barStyles = css({
  alignItems: "center",
  backgroundColor: "background",
  blockSize: 11,
  borderBlockEnd: "1px solid {colors.border}",
  display: "flex",
  gap: 3,
  insetBlockStart: 0,
  justifyContent: "space-between",
  lg: { marginBlockStart: -8, marginInline: -8, paddingInline: 8 },
  marginBlockStart: -4,
  marginInline: -4,
  md: { marginBlockStart: -6, marginInline: -6, paddingInline: 6 },
  paddingInline: 4,
  position: "sticky",
  zIndex: 5,
});

const pathStyles = css({
  alignItems: "center",
  display: "flex",
  gap: 1.5,
  minInlineSize: 0,
});

const iconStyles = css({
  alignItems: "center",
  color: "accent",
  display: "flex",
  flexShrink: 0,
});

const titleStyles = css({
  flexShrink: 0,
  fontSize: "sm",
  fontWeight: "semibold",
  whiteSpace: "nowrap",
});

const actionsStyles = css({
  alignItems: "center",
  display: "flex",
  flexShrink: 0,
  gap: 2,
});

// Floated to the centre of the bar, dimmer, independent of the path and actions
// on either side. Absolutely centred so it tracks the bar's midpoint rather than
// the space left between the flanks; hidden on narrow screens where the flanks
// would crowd it, and it truncates before overrunning them.
const descriptionStyles = css({
  color: "muted",
  display: "none",
  fontSize: "sm",
  insetInlineStart: "50%",
  maxInlineSize: "min(40%, 28rem)",
  md: { display: "block" },
  overflow: "hidden",
  position: "absolute",
  textOverflow: "ellipsis",
  transform: "translateX(-50%)",
  whiteSpace: "nowrap",
});
