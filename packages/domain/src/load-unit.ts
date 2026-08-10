import { z } from "zod";
import type { Modality } from "./movement";

/**
 * The unit a load is expressed in. Loads are unit-carrying rather than
 * implicitly pounds: a barbell athlete trains and logs in kilograms, a dumbbell
 * athlete in pounds, and the stored number means nothing without its unit.
 * Persisted alongside the load, so this is a wire enum (see DISCRIMINATED_UNIONS.md).
 */
export const loadUnitSchema = z.enum(["lb", "kg"]);

export type LoadUnit = z.infer<typeof loadUnitSchema>;

/** Pounds per kilogram — the exact international avoirdupois definition. */
const KG_PER_LB = 0.453_592_37;

/** The unit an exercise's load is expressed in, derived from its equipment.
 *  Barbell work is loaded and logged in kilograms; everything else in pounds.
 *  This is the single source of truth for the "barbell is metric" rule. */
export const modalityLoadUnit = (modality: Modality): LoadUnit =>
  modality === "barbell" ? "kg" : "lb";

/** Convert a pound load to kilograms (unrounded). */
export const lbToKg = (lb: number): number => lb * KG_PER_LB;

/** Convert a kilogram load to pounds (unrounded). */
export const kgToLb = (kg: number): number => kg / KG_PER_LB;

/** The smallest plate-pair increment a load rounds to, in its own unit: 2.5 kg
 *  (a pair of 1.25 kg plates) for metric loading, 5 lb for imperial. */
export const loadStep = (unit: LoadUnit): number => (unit === "kg" ? 2.5 : 5);

/** The weight of an empty barbell in its unit: the 20 kg / 45 lb standard bar. */
export const barWeight = (unit: LoadUnit): number => (unit === "kg" ? 20 : 45);
