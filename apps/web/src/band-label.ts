import type { BandLevel } from "@titan/domain/band";

/** The bands a set was worked against, written out — `Green + Red` for a
 *  stacked pair, `Purple` for a single band. The order is the order they are
 *  recorded in, heaviest first, so a combination always reads the same way. */
export const bandLabel = (bands: readonly BandLevel[]): string =>
  bands.map(titleCase).join(" + ");

const titleCase = (band: BandLevel): string =>
  `${band.slice(0, 1).toUpperCase()}${band.slice(1)}`;
