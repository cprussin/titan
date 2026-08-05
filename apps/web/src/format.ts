/** Human-readable formatters for the training units the UI shows. Pure. */

/** Round to the nearest half and drop a trailing `.0`. */
const tidy = (value: number): string => {
  const rounded = Math.round(value * 2) / 2;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
};

export const formatWeight = (lb: number): string => `${tidy(lb)} lb`;

export const formatMinutes = (minutes: number): string =>
  `${Math.round(minutes)} min`;

/** `m:ss` clock for the rest timer and short durations. */
export const formatClock = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.max(0, Math.round(totalSeconds - minutes * 60));
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

/** Rowing split as `m:ss.s /500m`. */
export const formatSplit = (secondsPer500: number): string => {
  const minutes = Math.floor(secondsPer500 / 60);
  const seconds = (secondsPer500 - minutes * 60).toFixed(1).padStart(4, "0");
  return `${minutes}:${seconds} /500m`;
};

export const formatDistance = (meters: number): string =>
  meters >= 1000 ? `${tidy(meters / 1000)} km` : `${Math.round(meters)} m`;
