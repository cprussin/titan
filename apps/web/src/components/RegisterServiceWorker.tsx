"use client";

import { useEffect } from "react";

/** Registers the offline service worker once on mount. Renders nothing. */
export const RegisterServiceWorker = () => {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
        // biome-ignore lint/suspicious/noConsole: surface a background registration failure
        console.error("Service worker registration failed", error);
      });
    }
  }, []);
  return undefined;
};
