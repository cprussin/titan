import { z } from "zod";
import { idSchema } from "./ids";
import type { LoadUnit } from "./load-unit";
import { loadUnitSchema } from "./load-unit";

/**
 * A **prescription**: the concrete target for one exercise in one session —
 * what the athlete is told to do today. It is the resolved output of the
 * program engine (base program + progression policy + history), and is stored
 * verbatim on the {@link WorkoutSession} so a historical prescription is never
 * recomputed (see ENGINE_SEPARATION.md).
 *
 * The six variants mirror the spec's exercise types. It is a persisted union,
 * so the `type` discriminant is a wire string with the Zod schema as the source
 * of truth; constructors funnel every producer through one place.
 */

const strengthSchema = z.object({
  reps: z.number().int().positive(),
  /** Optional target RPE (rate of perceived exertion, 1–10). */
  rpeTarget: z.number().positive().max(10).optional(),
  sets: z.number().int().positive(),
  type: z.literal("strength"),
  /** The unit `weight` is in — barbell work is kg, everything else lb. Defaults
   *  to pounds so pre-unit data and imperial callers stay valid. */
  unit: loadUnitSchema.default("lb"),
  /** The target load, expressed in {@link unit}. */
  weight: z.number().nonnegative(),
});

export type StrengthPrescription = z.infer<typeof strengthSchema>;

const bodyweightSchema = z.object({
  /** Added load for a weighted bodyweight movement (weighted pull-ups, dips),
   *  expressed in {@link unit}. */
  addedWeight: z.number().nonnegative().optional(),
  reps: z.number().int().positive(),
  sets: z.number().int().positive(),
  type: z.literal("bodyweight"),
  /** The unit `addedWeight` is in. Belt-loaded work hangs plates off the same
   *  tree as the barbell, so it is prescribed in kilograms; defaults to pounds
   *  so pre-unit data and imperial callers stay valid. */
  unit: loadUnitSchema.default("lb"),
});

export type BodyweightPrescription = z.infer<typeof bodyweightSchema>;

const timedHoldSchema = z.object({
  addedWeightLb: z.number().nonnegative().optional(),
  holdSec: z.number().positive(),
  sets: z.number().int().positive(),
  type: z.literal("timed-hold"),
});

export type TimedHoldPrescription = z.infer<typeof timedHoldSchema>;

const timedCardioSchema = z.object({
  durationSec: z.number().positive(),
  strokeRateMax: z.number().positive().optional(),
  strokeRateMin: z.number().positive().optional(),
  /** Heart-rate zone (1–5) the effort should stay in, when prescribed. */
  targetHrZone: z.number().int().min(1).max(5).optional(),
  type: z.literal("timed-cardio"),
});

export type TimedCardioPrescription = z.infer<typeof timedCardioSchema>;

const distanceCardioSchema = z.object({
  distanceMeters: z.number().positive(),
  targetSplitSecPer500: z.number().positive().optional(),
  type: z.literal("distance-cardio"),
});

export type DistanceCardioPrescription = z.infer<typeof distanceCardioSchema>;

const intervalsSchema = z.object({
  count: z.number().int().positive(),
  recoverySec: z.number().nonnegative(),
  targetSplitSecPer500: z.number().positive().optional(),
  type: z.literal("intervals"),
  /** Each interval is defined by distance OR time — the constructor sets
   *  exactly one; the other stays `undefined`. */
  workDistanceMeters: z.number().positive().optional(),
  workSec: z.number().positive().optional(),
});

export type IntervalsPrescription = z.infer<typeof intervalsSchema>;

const circuitStationSchema = z.object({
  distanceMeters: z.number().positive().optional(),
  durationSec: z.number().positive().optional(),
  exerciseId: idSchema,
  reps: z.number().int().positive().optional(),
});

export type CircuitStation = z.infer<typeof circuitStationSchema>;

const circuitSchema = z.object({
  restSec: z.number().nonnegative(),
  rounds: z.number().int().positive(),
  stations: z.array(circuitStationSchema).min(1),
  type: z.literal("circuit"),
});

export type CircuitPrescription = z.infer<typeof circuitSchema>;

/** A bodyweight prescription persisted before added load carried a unit, which
 *  stored the load under `addedWeightLb`. */
type LegacyBodyweight = Record<string, unknown> & { addedWeightLb: number };

const isLegacyBodyweight = (data: unknown): data is LegacyBodyweight =>
  typeof data === "object" &&
  data !== null &&
  "type" in data &&
  data.type === "bodyweight" &&
  "addedWeightLb" in data &&
  typeof data.addedWeightLb === "number";

/** Migrate-on-read for the legacy key (see DATA.md, "on read … migrate"): the
 *  load moves to `addedWeight` and the schema's `unit` default reads it as the
 *  pounds it was stored as. Runs before the union so every reader of a
 *  persisted prescription gets it, whichever document it was nested in. */
const migrateLegacyAddedWeight = (data: unknown): unknown => {
  if (isLegacyBodyweight(data)) {
    const { addedWeightLb, ...rest } = data;
    return { ...rest, addedWeight: addedWeightLb };
  } else {
    return data;
  }
};

export const prescriptionSchema = z.preprocess(
  migrateLegacyAddedWeight,
  z.discriminatedUnion("type", [
    strengthSchema,
    bodyweightSchema,
    timedHoldSchema,
    timedCardioSchema,
    distanceCardioSchema,
    intervalsSchema,
    circuitSchema,
  ]),
);

export type Prescription = z.infer<typeof prescriptionSchema>;

export const Prescription = {
  Bodyweight: (
    args: Omit<BodyweightPrescription, "type" | "unit"> & { unit?: LoadUnit },
  ): BodyweightPrescription => ({
    ...args,
    type: "bodyweight",
    unit: args.unit ?? "lb",
  }),
  Circuit: (args: Omit<CircuitPrescription, "type">): CircuitPrescription => ({
    ...args,
    type: "circuit",
  }),
  DistanceCardio: (
    args: Omit<DistanceCardioPrescription, "type">,
  ): DistanceCardioPrescription => ({ ...args, type: "distance-cardio" }),
  Intervals: (
    args: Omit<IntervalsPrescription, "type">,
  ): IntervalsPrescription => ({ ...args, type: "intervals" }),
  Strength: (
    args: Omit<StrengthPrescription, "type" | "unit"> & { unit?: LoadUnit },
  ): StrengthPrescription => ({
    ...args,
    type: "strength",
    unit: args.unit ?? "lb",
  }),
  TimedCardio: (
    args: Omit<TimedCardioPrescription, "type">,
  ): TimedCardioPrescription => ({ ...args, type: "timed-cardio" }),
  TimedHold: (
    args: Omit<TimedHoldPrescription, "type">,
  ): TimedHoldPrescription => ({ ...args, type: "timed-hold" }),
};
