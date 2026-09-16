import { z } from "zod";

/**
 * The resistance level of a band, named by its colour. The athlete's set runs
 * red (lightest) → black → purple → green (heaviest). A band carries no load in
 * pounds or kilograms, and the colours are deliberately not mapped to one: a
 * band's resistance depends on how far it is stretched, so a converted figure
 * would be fiction. Persisted alongside a logged set, so this is a wire enum
 * (see DISCRIMINATED_UNIONS.md).
 */
export const bandLevelSchema = z.enum(["red", "black", "purple", "green"]);

export type BandLevel = z.infer<typeof bandLevelSchema>;

/**
 * The band combinations the athlete's set makes, ordered ascending by
 * resistance. Bands stack — pushing against green and red together is harder
 * than green alone — but only these combinations are worth offering: the rest
 * either duplicate a rung of this ladder or overlap one. This is the menu a
 * logged set's bands are chosen from, not a validator: a set records whichever
 * bands were used.
 */
export const BAND_COMBINATIONS: readonly (readonly BandLevel[])[] = [
  ["red"],
  ["black"],
  ["purple"],
  ["green"],
  ["green", "red"],
  ["green", "black"],
  ["green", "purple"],
  ["green", "purple", "red"],
  ["green", "purple", "black"],
  ["green", "purple", "black", "red"],
];
