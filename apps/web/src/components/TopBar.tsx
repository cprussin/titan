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
 * The consistent bar every page opens with: an optional breadcrumb trail, the
 * page title and one-line description, and an optional actions slot (page-wide
 * controls like "Cancel workout") that sits beside the title on wider screens
 * and stacks beneath it on phones. A single rule under the bar sets it off from
 * the page content. Centralizing it gives every page the same header rhythm
 * instead of each rolling its own.
 */
export const TopBar = ({ actions, breadcrumbs, description, title }: Props) => (
  <div className={rootStyles}>
    {breadcrumbs !== undefined && breadcrumbs.length > 0 && (
      <nav aria-label="Breadcrumb" className={crumbsStyles}>
        {breadcrumbs.map((crumb, index) => (
          <Fragment key={crumb.href}>
            {index > 0 && <CaretRightIcon size={12} />}
            <Link className={crumbLinkStyles} href={crumb.href}>
              {crumb.label}
            </Link>
          </Fragment>
        ))}
      </nav>
    )}
    <div className={mainStyles}>
      <div className={textStyles}>
        <h1 className={titleStyles}>{title}</h1>
        {description !== undefined && (
          <p className={descriptionStyles}>{description}</p>
        )}
      </div>
      {actions !== undefined && <div className={actionsStyles}>{actions}</div>}
    </div>
  </div>
);

const rootStyles = css({
  borderBlockEnd: "1px solid {colors.border}",
  display: "flex",
  flexDirection: "column",
  gap: 2,
  paddingBlockEnd: 4,
});

const crumbsStyles = css({
  alignItems: "center",
  color: "muted",
  display: "flex",
  flexWrap: "wrap",
  fontSize: "sm",
  fontWeight: "medium",
  gap: 1.5,
});

const crumbLinkStyles = css({
  _hover: { color: "foreground" },
  color: "accent",
  transition: "color {durations.fast} {easings.out}",
});

const mainStyles = css({
  alignItems: "flex-start",
  display: "flex",
  flexDirection: "column",
  gap: 3,
  justifyContent: "space-between",
  md: { alignItems: "center", flexDirection: "row" },
});

const textStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: 1,
  minInlineSize: 0,
});

const titleStyles = css({
  fontSize: "3xl",
  fontWeight: "bold",
  letterSpacing: "tight",
  lg: { fontSize: "4xl" },
});

const descriptionStyles = css({ color: "muted", fontSize: "sm" });

const actionsStyles = css({
  alignItems: "center",
  display: "flex",
  flexShrink: 0,
  gap: 2,
});
