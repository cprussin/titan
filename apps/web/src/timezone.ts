import { z } from "zod";

/**
 * The visitor's IANA time zone, reported by the browser and carried to the
 * server in a cookie so server-rendered pages compute "today" against the
 * athlete's local calendar day. See `TimezoneSync` (writer) and
 * `server/local-date.ts` (reader).
 */

/** Cookie the browser writes its detected IANA zone into. */
export const TIMEZONE_COOKIE = "tz";

/** Zone used until the browser has reported one, and for unrecognized values. */
const FALLBACK_TIME_ZONE = "UTC";

const supportedTimeZones = new Set(Intl.supportedValuesOf("timeZone"));

const timeZoneSchema = z
  .string()
  .refine((value) => supportedTimeZones.has(value));

/**
 * Parse the cookie's time-zone value, falling back to UTC when the cookie is
 * absent (first visit, before the browser reports) or carries a value that is
 * not a recognized IANA zone.
 */
export const resolveTimeZone = (raw: string | undefined): string => {
  const parsed = timeZoneSchema.safeParse(raw);
  return parsed.success ? parsed.data : FALLBACK_TIME_ZONE;
};
