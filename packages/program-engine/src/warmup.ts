import type { WarmupSet } from "@titan/domain/workout-session";

/** The empty-barbell weight (lb) every barbell warm-up starts from. */
const BAR_WEIGHT_LB = 45;
/** Smallest plate-pair increment; warm-up loads round to this. */
const LOAD_STEP_LB = 5;
/** The ramp toward a working weight: fraction of the working load and reps. */
const RAMP = [
  { pct: 0.4, reps: 5 },
  { pct: 0.55, reps: 5 },
  { pct: 0.7, reps: 3 },
  { pct: 0.85, reps: 2 },
] as const;

/**
 * Generate barbell warm-up sets for a working weight: start with the empty bar,
 * then ramp through 40/55/70/85% (rounded to the nearest 5 lb), dropping any
 * ramp step that isn't strictly between the bar and the working weight and
 * collapsing duplicate loads. A working weight at or below the bar needs no
 * warm-up. The result excludes the working sets themselves.
 */
export const generateWarmup = (
  workingWeightLb: number,
  barWeightLb = BAR_WEIGHT_LB,
): WarmupSet[] => {
  if (workingWeightLb <= barWeightLb) {
    return [];
  } else {
    const ramp = RAMP.map((step) => ({
      reps: step.reps,
      weightLb: roundStep(workingWeightLb * step.pct),
    })).filter(
      (set) => set.weightLb > barWeightLb && set.weightLb < workingWeightLb,
    );
    return dedupeByWeight([{ reps: 5, weightLb: barWeightLb }, ...ramp]);
  }
};

const roundStep = (weightLb: number): number =>
  Math.round(weightLb / LOAD_STEP_LB) * LOAD_STEP_LB;

/** Drop a set whose load equals the previous set's, keeping the earlier (higher-
 *  rep) one so the ramp never repeats a weight. */
const dedupeByWeight = (sets: readonly WarmupSet[]): WarmupSet[] =>
  sets.filter(
    (set, index) => index === 0 || set.weightLb !== sets[index - 1]?.weightLb,
  );
