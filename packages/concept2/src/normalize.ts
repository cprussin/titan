import type { NormalizedWorkout } from "@titan/domain/external";
import { splitSecPer500 } from "@titan/domain/pace";
import type { CardioResult, IntervalResult } from "@titan/domain/result";
import type { Concept2Interval, Concept2Result } from "./concept2-api";
import { concept2ResultSchema } from "./concept2-api";

/** Concept2 reports elapsed time in tenths of a second. */
const TENTHS_PER_SECOND = 10;

/**
 * Parse a raw Concept2 result payload and map it to the provider-neutral
 * {@link NormalizedWorkout}. Time is converted from Concept2's tenths-of-seconds
 * to seconds, the per-500m split is derived from distance and duration, and
 * heart-rate / stroke-rate carry through only when the payload provides them
 * (absent optics stay absent — see `exactOptionalPropertyTypes`). A workout
 * logged without a monitor reports `heart_rate.average` as `0`, which the
 * domain treats as no reading, so a non-positive average is omitted too.
 */
export const normalizeWorkout = (raw: unknown): NormalizedWorkout => {
  const result = concept2ResultSchema.parse(raw);
  return {
    intervals: (result.workout?.intervals ?? []).map(toIntervalResult),
    summary: toSummary(result),
    workoutAt: result.date.replace(" ", "T"),
  };
};

const toSummary = (result: Concept2Result): CardioResult => {
  const durationSec = result.time / TENTHS_PER_SECOND;
  return {
    distanceMeters: result.distance,
    durationSec,
    ...(result.heart_rate !== undefined && result.heart_rate.average > 0
      ? { avgHr: result.heart_rate.average }
      : {}),
    ...(result.stroke_rate === undefined
      ? {}
      : { avgStrokeRate: result.stroke_rate }),
    ...(result.distance > 0
      ? { splitSecPer500: splitSecPer500(result.distance, durationSec) }
      : {}),
  };
};

const toIntervalResult = (
  interval: Concept2Interval,
  index: number,
): IntervalResult => {
  const durationSec = interval.time / TENTHS_PER_SECOND;
  return {
    distanceMeters: interval.distance,
    durationSec,
    index,
    ...(interval.heart_rate !== undefined && interval.heart_rate.average > 0
      ? { avgHr: interval.heart_rate.average }
      : {}),
    ...(interval.stroke_rate === undefined
      ? {}
      : { strokeRate: interval.stroke_rate }),
    ...(interval.distance > 0
      ? { splitSecPer500: splitSecPer500(interval.distance, durationSec) }
      : {}),
  };
};
