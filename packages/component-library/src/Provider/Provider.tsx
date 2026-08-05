import type { PropsWithChildren } from "react";

import type { LinkComponent } from "../LinkProvider/LinkProvider";
import { LinkProvider } from "../LinkProvider/LinkProvider";
import { ThemeProvider } from "../ThemeSwitch/ThemeProvider";

type Props = PropsWithChildren<{
  /** The app's router link, forwarded to {@link LinkProvider}; `<a>` if unset. */
  link?: LinkComponent | undefined;
}>;

/**
 * The single entry point for the component library's runtime context. Mount it
 * once around the app root and every library feature that needs a provider is
 * wired — in the right order — behind this one component: the theme controller
 * and the link provider today, whatever we add tomorrow. App code composes one
 * `<Provider>` and can't forget a provider or nest them wrong.
 */
export const Provider = ({ children, link }: Props) => (
  <ThemeProvider>
    <LinkProvider link={link}>{children}</LinkProvider>
  </ThemeProvider>
);
