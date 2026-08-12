"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { TIMEZONE_COOKIE } from "../timezone";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * Reports the browser's IANA time zone to the server via the `tz` cookie so
 * server-rendered "today" tracks the athlete's local calendar day instead of
 * the server's UTC day. Writes the cookie and refreshes the route only when the
 * detected zone differs from what the server already sees (`current`), so it
 * neither loops nor refreshes on every mount. Renders nothing.
 *
 * @param detect - Reads the browser's zone; injected in tests, defaults to the
 *   real `Intl` lookup.
 */
export const TimezoneSync = ({
  current,
  detect = detectTimeZone,
}: {
  current: string | undefined;
  detect?: () => string;
}): undefined => {
  const router = useRouter();
  useEffect(() => {
    const detected = detect();
    if (detected !== current) {
      // The Cookie Store API is async and unsupported in Safari; a plain cookie
      // write is the portable way to hand the detected zone to the server.
      // biome-ignore lint/suspicious/noDocumentCookie: portable synchronous cookie write
      document.cookie = `${TIMEZONE_COOKIE}=${detected}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
      router.refresh();
    }
  }, [current, detect, router]);
  return undefined;
};

const detectTimeZone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;
