import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { Fragment } from "react";
import { css } from "../../styled-system/css";
import { useLink } from "../LinkProvider/LinkProvider";

/** One breadcrumb: the ancestor `label` and the `href` it links back to. */
export type Crumb = {
  href: string;
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
        <Fragment key={crumb.href}>
          <Link className={linkStyles} href={crumb.href}>
            {crumb.label}
          </Link>
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

const separatorStyles = css({ color: "textTertiary", flexShrink: 0 });
