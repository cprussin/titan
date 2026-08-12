import type { LoadUnit } from "@titan/domain/load-unit";

/** Formatters (and the inverse duration parser) for the training units the UI
 *  shows. Pure. */

/** Round to the nearest half and drop a trailing `.0`. */
const tidy = (value: number): string => {
  const rounded = Math.round(value * 2) / 2;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
};

/** A load with its unit — `225 lb`, `130 kg`. Barbell loads are kilograms,
 *  everything else pounds; the unit travels with the number (defaulting to lb
 *  for imperial callers). */
export const formatWeight = (weight: number, unit: LoadUnit = "lb"): string =>
  `${tidy(weight)} ${unit}`;

/** A logged body weight, kept to the tenth of a pound a scale reads and
 *  dropping a trailing `.0`. Unlike {@link formatWeight}, it isn't snapped to
 *  the nearest half — body weight isn't a barbell load. */
export const formatBodyWeight = (weightLb: number): string => {
  const rounded = Math.round(weightLb * 10) / 10;
  const text = Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
  return `${text} lb`;
};

export const formatMinutes = (minutes: number): string =>
  `${Math.round(minutes)} min`;

/** `m:ss` clock for the rest timer and short durations. */
export const formatClock = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.max(0, Math.round(totalSeconds - minutes * 60));
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

/** Signed `m:ss` clock for a timer that runs past zero — negative values (rest
 *  overtime) carry a leading minus, e.g. `-0:05`. */
export const formatSignedClock = (totalSeconds: number): string =>
  totalSeconds < 0
    ? `-${formatClock(-totalSeconds)}`
    : formatClock(totalSeconds);

/** Rowing split as `m:ss.s /500m`. */
export const formatSplit = (secondsPer500: number): string => {
  const minutes = Math.floor(secondsPer500 / 60);
  const seconds = (secondsPer500 - minutes * 60).toFixed(1).padStart(4, "0");
  return `${minutes}:${seconds} /500m`;
};

/** Rowing distance is measured to the metre — a time-based piece covers an
 *  arbitrary distance whose exact value is the point, so it is never snapped to
 *  a coarser kilometre. Thousands are grouped so a long row stays readable. */
const metersFormat = new Intl.NumberFormat("en-US");

export const formatDistance = (meters: number): string =>
  `${metersFormat.format(Math.round(meters))} m`;

/** At or above this length a piece is logged to the whole second; tenths that
 *  matter on a sprint are noise on a long steady row. */
const WHOLE_SECOND_CEILING_SEC = 600;

/**
 * A logged effort's elapsed time, at the precision the piece warrants: `s.s`
 * under a minute, `m:ss.s` up to ten minutes, and `m:ss` beyond that. Rounding
 * happens before the minute split so a second rounding up to 60 carries.
 */
export const formatDuration = (totalSeconds: number): string => {
  const scale = totalSeconds >= WHOLE_SECOND_CEILING_SEC ? 1 : 10;
  const rounded = Math.round(totalSeconds * scale) / scale;
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded - minutes * 60;
  const secondsText =
    scale === 10 ? seconds.toFixed(1) : `${Math.round(seconds)}`;
  return minutes === 0
    ? secondsText
    : `${minutes}:${secondsText.padStart(scale === 10 ? 4 : 2, "0")}`;
};

/**
 * Parse a duration a user types while logging a timed piece — `m:ss`, `m:ss.s`,
 * or a bare seconds value — into seconds. Returns `undefined` for blank or
 * malformed input, so an in-progress field reads the same as an untouched one.
 */
export const parseDuration = (text: string): number | undefined => {
  const segments = text.trim().split(":");
  switch (segments.length) {
    case 1: {
      return toNonNegative(segments[0]);
    }
    case 2: {
      const minutes = toNonNegative(segments[0]);
      const seconds = toNonNegative(segments[1]);
      return minutes === undefined || seconds === undefined || seconds >= 60
        ? undefined
        : minutes * 60 + seconds;
    }
    default: {
      return undefined;
    }
  }
};

/** A trimmed, non-empty, finite, non-negative number, or `undefined`. */
const toNonNegative = (text: string | undefined): number | undefined => {
  const trimmed = text?.trim();
  if (trimmed === undefined || trimmed === "") {
    return undefined;
  } else {
    const value = Number(trimmed);
    return Number.isFinite(value) && value >= 0 ? value : undefined;
  }
};
