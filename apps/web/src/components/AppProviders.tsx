"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Provider } from "../ui";

/**
 * Wires the library {@link Provider} with the app's Next.js `Link`. This lives
 * in a client component so the `Link` reference never crosses the server→client
 * boundary as a prop (Next forbids passing functions to client components from
 * server components); here both the provider and the link are client-side.
 */
export const AppProviders = ({ children }: { children: ReactNode }) => (
  <Provider link={Link}>{children}</Provider>
);
