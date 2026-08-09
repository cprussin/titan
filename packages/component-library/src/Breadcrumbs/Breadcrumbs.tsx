import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { Fragment } from "react";
import { css } from "../../styled-system/css";
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
 */
export const Breadcrumbs = ({ crumbs }: Props) => {
  const Link = useLink();
  return (
    <>
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
    </>
  );
};

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
