import { z } from "zod";

/**
 * A **progression policy**: the reusable strategy that decides how an exercise's
 * prescription evolves between sessions. Policies are data, referenced by
 * exercise slots in a program definition — progression logic is never hard-coded
 * into an exercise (see the spec's "Progression Policies"). The
 * `@titan/adaptation-engine` interprets a policy plus history into the next
 * prescription; this module only defines the shape.
 *
 * This is a persisted / wire union, so the `kind` discriminant stays a string
 * and the Zod schema is the source of truth. Constructors still funnel every
 * producer through one place (see DISCRIMINATED_UNIONS.md → "Wire-format unions
 * still get constructors").
 */

const linearSchema = z.object({
  /** Pounds added after a fully-completed session under the RPE cap. */
  incrementLb: z.number().positive(),
  kind: z.literal("linear"),
  /** Consecutive missed sessions that trigger a deload. */
  missesBeforeDeload: z.number().int().positive(),
  reps: z.number().int().positive(),
  /** Fraction of the weight kept on a deload, e.g. 0.9 → drop 10%. */
  retainOnDeload: z.number().positive().max(1),
  /** Average RPE at or below which the increment is applied. */
  rpeCap: z.number().positive(),
  sets: z.number().int().positive(),
});

export type LinearPolicy = z.infer<typeof linearSchema>;

const doubleSchema = z.object({
  incrementLb: z.number().positive(),
  kind: z.literal("double"),
  maxReps: z.number().int().positive(),
  minReps: z.number().int().positive(),
  rpeCap: z.number().positive(),
  sets: z.number().int().positive(),
});

export type DoublePolicy = z.infer<typeof doubleSchema>;

const amrapSchema = z.object({
  kind: z.literal("amrap"),
  /** Rep ceiling per set; above it, progress via added weight or tempo. */
  repCap: z.number().int().positive(),
  sets: z.number().int().positive(),
});

export type AmrapPolicy = z.infer<typeof amrapSchema>;

const timedHoldSchema = z.object({
  /** Once the hold reaches this duration, progress by adding weight instead. */
  addWeightAfterSec: z.number().positive(),
  holdIncrementSec: z.number().positive(),
  kind: z.literal("timed-hold"),
  sets: z.number().int().positive(),
  startSec: z.number().positive(),
});

export type TimedHoldPolicy = z.infer<typeof timedHoldSchema>;

const intervalSchema = z.object({
  kind: z.literal("interval"),
  /** Max allowed per-500m slowdown across the intervals to still advance. */
  maxDegradationSecPer500: z.number().positive(),
  /** Seconds-per-500m the target split improves by when criteria are met. */
  paceImprovementSecPer500: z.number().positive(),
  rpeCap: z.number().positive(),
});

export type IntervalPolicy = z.infer<typeof intervalSchema>;

const zone2Schema = z.object({
  durationIncrementSec: z.number().positive(),
  kind: z.literal("zone2"),
  maxDurationSec: z.number().positive(),
  startDurationSec: z.number().positive(),
});

export type Zone2Policy = z.infer<typeof zone2Schema>;

/** One load step of an {@link RpeBandedPolicy}: add `incrementLb` when the
 *  final working set's RPE is at or below `maxRpe`. */
const rpeBandSchema = z.object({
  incrementLb: z.number().positive(),
  maxRpe: z.number().positive().max(10),
});

export type RpeBand = z.infer<typeof rpeBandSchema>;

const rpeBandedSchema = z.object({
  /** Load steps ordered ascending by `maxRpe`. The tightest band whose `maxRpe`
   *  covers the final-set RPE applies; a final-set RPE above every band's
   *  ceiling (or a missed session) repeats the load. Distinct upper/lower
   *  increments and the "faster while regaining" schedule are expressed by the
   *  chosen bands, so no separate cap is needed. */
  bands: z.array(rpeBandSchema).min(1),
  kind: z.literal("rpe-banded"),
  reps: z.number().int().positive(),
  sets: z.number().int().positive(),
});

export type RpeBandedPolicy = z.infer<typeof rpeBandedSchema>;

/** No automatic progression — recovery work and open-ended easy cardio. */
const noneSchema = z.object({
  kind: z.literal("none"),
});

export type NonePolicy = z.infer<typeof noneSchema>;

export const progressionPolicySchema = z.discriminatedUnion("kind", [
  linearSchema,
  doubleSchema,
  amrapSchema,
  timedHoldSchema,
  intervalSchema,
  zone2Schema,
  rpeBandedSchema,
  noneSchema,
]);

export type ProgressionPolicy = z.infer<typeof progressionPolicySchema>;

export const ProgressionPolicy = {
  Amrap: (args: Omit<AmrapPolicy, "kind">): AmrapPolicy => ({
    ...args,
    kind: "amrap",
  }),
  Double: (args: Omit<DoublePolicy, "kind">): DoublePolicy => ({
    ...args,
    kind: "double",
  }),
  Interval: (args: Omit<IntervalPolicy, "kind">): IntervalPolicy => ({
    ...args,
    kind: "interval",
  }),
  Linear: (args: Omit<LinearPolicy, "kind">): LinearPolicy => ({
    ...args,
    kind: "linear",
  }),
  None: (): NonePolicy => ({ kind: "none" }),
  RpeBanded: (args: Omit<RpeBandedPolicy, "kind">): RpeBandedPolicy => ({
    ...args,
    kind: "rpe-banded",
  }),
  TimedHold: (args: Omit<TimedHoldPolicy, "kind">): TimedHoldPolicy => ({
    ...args,
    kind: "timed-hold",
  }),
  Zone2: (args: Omit<Zone2Policy, "kind">): Zone2Policy => ({
    ...args,
    kind: "zone2",
  }),
};
