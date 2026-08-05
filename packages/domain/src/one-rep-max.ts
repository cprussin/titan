/**
 * Estimated one-rep max via the Epley formula: `weight × (1 + reps / 30)`.
 * A single rep returns the weight unchanged. Used by strength analytics to plot
 * a comparable "top-end strength" line across sets of differing rep counts.
 *
 * `reps` must be positive — a zero/negative rep count is a caller bug, not a
 * recoverable input, so it throws (see ERRORS.md).
 */
export const estimateOneRepMax = (weight: number, reps: number): number => {
  if (reps <= 0) {
    throw new Error(`reps must be positive, got ${reps}`);
  } else if (reps === 1) {
    // A single-rep set IS a one-rep max; Epley's `1 + r/30` term overshoots
    // by 1/30 at r=1, so return the lifted weight directly.
    return weight;
  } else {
    return weight * (1 + reps / 30);
  }
};
