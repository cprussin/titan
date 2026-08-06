"use client";

import type { ComponentType, ReactNode } from "react";
import { createContext, useContext } from "react";

/**
 * The shape a link component must satisfy to back the library's navigation
 * links. An app's router link (e.g. Next's `Link`) is assignable to this.
 */
export type LinkComponent = ComponentType<{
  children: ReactNode;
  className?: string | undefined;
  href: string;
}>;

const DefaultLink: LinkComponent = ({ children, className, href }) => (
  <a className={className} href={href}>
    {children}
  </a>
);

const LinkContext = createContext<LinkComponent>(DefaultLink);

/**
 * Lets the app supply its router's link component for library components that
 * render in-app navigation, without the library depending on any router. When
 * absent it falls back to a plain `<a>`, so library links work with no setup in
 * isolation (Storybook, tests). Composed into {@link Provider}, which forwards
 * its `link` prop here.
 */
export const LinkProvider = ({
  children,
  link,
}: {
  children: ReactNode;
  link?: LinkComponent | undefined;
}) => (
  <LinkContext.Provider value={link ?? DefaultLink}>
    {children}
  </LinkContext.Provider>
);

/** The link component for in-app navigation; a plain `<a>` unless provided. */
export const useLink = (): LinkComponent => useContext(LinkContext);
