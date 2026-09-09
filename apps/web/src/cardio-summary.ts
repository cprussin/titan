import type { CardioResult } from "@titan/domain/result";
import { formatDistance, formatDuration, formatSplit } from "./format";

/**
 * One line describing a cardio effort — `2,000 m · 8:04.5 · 2:01.1 /500m · 136
 * bpm` — carrying only the optics the piece actually recorded, and `—` when it
 * recorded none. Shared by the completed-exercise recap and the Concept2
 * hand-off, so a row reads the same wherever it is shown.
 */
export const cardioSummary = (cardio: CardioResult): string => {
  const parts = [
    cardio.distanceMeters === undefined
      ? undefined
      : formatDistance(cardio.distanceMeters),
    cardio.durationSec === undefined
      ? undefined
      : formatDuration(cardio.durationSec),
    cardio.splitSecPer500 === undefined
      ? undefined
      : formatSplit(cardio.splitSecPer500),
    cardio.avgHr === undefined ? undefined : `${cardio.avgHr} bpm`,
  ].filter((part) => part !== undefined);
  return parts.length === 0 ? "—" : parts.join(" · ");
};
