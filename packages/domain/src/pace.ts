/**
 * Rowing pace math. The universal rowing unit is the **split**: seconds per
 * 500 metres. These two conversions are inverses and are the only place the
 * `metres ↔ split ↔ time` relationship is expressed, so analytics, interval
 * targets, and Concept2 normalization all agree.
 */

/** The per-500m split implied by covering `distanceMeters` in `elapsedSec`. */
export const splitSecPer500 = (
  distanceMeters: number,
  elapsedSec: number,
): number => {
  if (distanceMeters <= 0) {
    throw new Error(`distanceMeters must be positive, got ${distanceMeters}`);
  } else {
    return elapsedSec / (distanceMeters / 500);
  }
};

/** The elapsed time to cover `distanceMeters` at a given `splitSecPer500`. */
export const projectedSplitTimeSec = (
  distanceMeters: number,
  split: number,
): number => split * (distanceMeters / 500);
