import { cookies } from "next/headers";
import { dateIso } from "../date";
import { resolveTimeZone, TIMEZONE_COOKIE } from "../timezone";

/**
 * Today's `YYYY-MM-DD` in the visitor's own time zone, read from the `tz`
 * cookie `TimezoneSync` sets. Falls back to UTC until the browser has reported
 * a zone (see `resolveTimeZone`), so a first, cookie-less request behaves as
 * before rather than failing.
 */
export const todayIso = async (): Promise<string> => {
  const store = await cookies();
  return dateIso(resolveTimeZone(store.get(TIMEZONE_COOKIE)?.value));
};
