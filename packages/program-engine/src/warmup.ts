import type { LoadUnit } from "@titan/domain/load-unit";
import { barWeight, loadStep } from "@titan/domain/load-unit";
import type { WarmupSet } from "@titan/domain/workout-session";

/** The ramp toward a working weight: fraction of the working load and reps. */
const RAMP = [
  { pct: 0.4, reps: 5 },
  { pct: 0.55, reps: 5 },
  { pct: 0.7, reps: 3 },
  { pct: 0.85, reps: 2 },
] as const;

/**
 * Generate barbell warm-up sets for a working weight: start with the empty bar,
 * then ramp through 40/55/70/85% (rounded to the nearest plate step), dropping
 * any ramp step that isn't strictly between the bar and the working weight and
 * collapsing duplicate loads. A working weight at or below the bar needs no
 * warm-up. The result excludes the working sets themselves. Loads are in the
 * working set's unit, so the empty bar and plate step follow it — a 20 kg bar
 * ramping by 2.5 kg for metric loading, a 45 lb bar by 5 lb for imperial.
 */
export const generateWarmup = (
  workingWeight: number,
  unit: LoadUnit,
  bar: number = barWeight(unit),
): WarmupSet[] => {
  if (workingWeight <= bar) {
    return [];
  } else {
    const step = loadStep(unit);
    const ramp = RAMP.map((rampStep) => ({
      reps: rampStep.reps,
      weight: roundStep(workingWeight * rampStep.pct, step),
    })).filter((set) => set.weight > bar && set.weight < workingWeight);
    return dedupeByWeight([{ reps: 5, weight: bar }, ...ramp]);
  }
};

const roundStep = (weight: number, step: number): number =>
  Math.round(weight / step) * step;

/** Drop a set whose load equals the previous set's, keeping the earlier (higher-
 *  rep) one so the ramp never repeats a weight. */
const dedupeByWeight = (sets: readonly WarmupSet[]): WarmupSet[] =>
  sets.filter(
    (set, index) => index === 0 || set.weight !== sets[index - 1]?.weight,
  );
