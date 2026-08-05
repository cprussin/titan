import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import Link from "next/link";
import type { ReactNode } from "react";
import { Fragment } from "react";
import { css } from "../../styled-system/css";

/** One breadcrumb: the ancestor `label` and the `href` it links back to. */
export type Crumb = {
  href: string;
  label: string;
};

type Props = {
  actions?: ReactNode | undefined;
  breadcrumbs?: readonly Crumb[] | undefined;
  description?: string | undefined;
  title: string;
};

/**
 * The static header bar every page opens with. It pins to the top of the
 * content column (sticky, opaque, with a rule beneath) and holds a compact
 * breadcrumb-and-title row on the start edge with a page-wide actions slot —
 * "Cancel workout" and the like — on the end. The bar bleeds to the column
 * edges so its rule runs the full width; an optional description sits just
 * beneath it, in normal flow, as a subtitle. Centralizing it gives every page
 * the same header chrome instead of each rolling its own.
 */
export const TopBar = ({ actions, breadcrumbs, description, title }: Props) => (
  <div className={rootStyles}>
    <div className={barStyles}>
      <div className={pathStyles}>
        {breadcrumbs !== undefined && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className={crumbsStyles}>
            {breadcrumbs.map((crumb) => (
              <Fragment key={crumb.href}>
                <Link className={crumbLinkStyles} href={crumb.href}>
                  {crumb.label}
                </Link>
                <CaretRightIcon className={separatorStyles} size={12} />
              </Fragment>
            ))}
          </nav>
        )}
        <h1 className={titleStyles}>{title}</h1>
      </div>
      {actions !== undefined && <div className={actionsStyles}>{actions}</div>}
    </div>
    {description !== undefined && (
      <p className={descriptionStyles}>{description}</p>
    )}
  </div>
);

const rootStyles = css({
  display: "flex",
  flexDirection: "column",
});

// The bar pins to the top and bleeds to the content-column edges, negating the
// main padding so its background and rule run the full width and it sits flush
// to the top before pinning.
const barStyles = css({
  alignItems: "center",
  backgroundColor: "background",
  borderBlockEnd: "1px solid {colors.border}",
  display: "flex",
  gap: 3,
  insetBlockStart: 0,
  justifyContent: "space-between",
  lg: { marginBlockStart: -8, marginInline: -8, paddingInline: 8 },
  marginBlockStart: -4,
  marginInline: -4,
  md: { marginInline: -6, paddingInline: 6 },
  paddingBlock: 3,
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

const crumbsStyles = css({
  alignItems: "center",
  color: "muted",
  display: "flex",
  flexShrink: 0,
  gap: 1.5,
});

const crumbLinkStyles = css({
  _hover: { color: "foreground" },
  color: "accent",
  fontSize: "sm",
  fontWeight: "medium",
  transition: "color {durations.fast} {easings.out}",
});

const separatorStyles = css({ color: "muted" });

const titleStyles = css({
  fontSize: "lg",
  fontWeight: "semibold",
  letterSpacing: "tight",
  lg: { fontSize: "xl" },
  minInlineSize: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const actionsStyles = css({
  alignItems: "center",
  display: "flex",
  flexShrink: 0,
  gap: 2,
});

const descriptionStyles = css({
  color: "muted",
  fontSize: "sm",
  paddingBlockStart: 4,
});
