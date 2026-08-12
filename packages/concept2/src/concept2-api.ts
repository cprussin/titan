import { z } from "zod";

/**
 * Zod schemas for the Concept2 Logbook API "result" payload — the shape of a
 * single logged workout as the API returns it, and the envelope the results
 * endpoint wraps a page of them in. These parse data crossing the HTTP boundary
 * (see DATA.md), so every field the normalizer reads is validated here once.
 *
 * Three Concept2 conventions are load-bearing: `time` is in *tenths of a
 * second* (not seconds); `heart_rate` is frequently absent — a workout logged
 * without a monitor has no heart-rate object at all — so it is optional here and
 * omitted downstream rather than defaulted; and a `workout` object carries
 * `intervals` only for interval pieces, so that array is optional too and the
 * normalizer treats its absence as "no intervals".
 */

export const concept2HeartRateSchema = z.object({
  average: z.number(),
});

export type Concept2HeartRate = z.infer<typeof concept2HeartRateSchema>;

export const concept2IntervalSchema = z.object({
  distance: z.number(),
  heart_rate: concept2HeartRateSchema.optional(),
  stroke_rate: z.number().optional(),
  time: z.number(),
});

export type Concept2Interval = z.infer<typeof concept2IntervalSchema>;

export const concept2WorkoutSchema = z.object({
  intervals: z.array(concept2IntervalSchema).optional(),
});

export type Concept2Workout = z.infer<typeof concept2WorkoutSchema>;

export const concept2ResultSchema = z.object({
  date: z.string(),
  distance: z.number(),
  heart_rate: concept2HeartRateSchema.optional(),
  id: z.number(),
  stroke_rate: z.number().optional(),
  time: z.number(),
  type: z.string(),
  workout: concept2WorkoutSchema.optional(),
});

export type Concept2Result = z.infer<typeof concept2ResultSchema>;

export const concept2ResultsResponseSchema = z.object({
  data: z.array(concept2ResultSchema),
});

export type Concept2ResultsResponse = z.infer<
  typeof concept2ResultsResponseSchema
>;
