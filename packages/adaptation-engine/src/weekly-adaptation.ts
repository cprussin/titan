import type { AdaptationNote } from "./note";

/** A rolled-up view of a completed training week, the input to weekly
 *  adaptation. */
export type WeekSummary = {
  /** Average session RPE across the week, if any was logged. */
  avgRpe?: number;
  cardioProgressed: boolean;
  /** Fraction of prescribed sessions completed, 0–1. */
  completionPct: number;
  /** Insert a deload every N weeks; `undefined` means the block schedules none. */
  deloadEveryWeeks?: number;
  strengthProgressed: boolean;
  /** Completed training weeks since the last deload (this week not counted). */
  weeksSinceDeload: number;
};

/** Completion below this fraction repeats the week rather than advancing. */
const REPEAT_THRESHOLD = 0.6;
/** Completion at or above this fraction is a "strong" week. */
const STRONG_THRESHOLD = 0.8;
/** Average RPE above this recommends a volume reduction. */
const HIGH_RPE_THRESHOLD = 9;

/**
 * The **weekly-adaptation layer**. Evaluates a completed week and recommends
 * exactly one action: trigger a scheduled deload, repeat the week, recommend
 * reduced volume, or advance. Deterministic and explained; the app records the
 * result as an `AdaptationDecision`.
 */
export const evaluateWeek = (summary: WeekSummary): AdaptationNote => {
  if (isDeloadDue(summary)) {
    return {
      action: "trigger-deload",
      details: { weeksSinceDeload: summary.weeksSinceDeload },
      explanation: `Scheduled deload: this is training week ${summary.weeksSinceDeload + 1} since the last deload.`,
    };
  } else if (summary.completionPct < REPEAT_THRESHOLD) {
    return {
      action: "repeat-week",
      details: { completionPct: round2(summary.completionPct) },
      explanation: `Repeat the week: only ${percent(summary.completionPct)} of prescribed sessions were completed.`,
    };
  } else if (
    summary.avgRpe !== undefined &&
    summary.avgRpe > HIGH_RPE_THRESHOLD
  ) {
    return {
      action: "reduce-volume",
      details: { avgRpe: round2(summary.avgRpe) },
      explanation: `Recommend reduced volume: average session RPE was ${round2(summary.avgRpe)}, above the ${HIGH_RPE_THRESHOLD} threshold.`,
    };
  } else {
    return advance(summary);
  }
};

const isDeloadDue = (summary: WeekSummary): boolean =>
  summary.deloadEveryWeeks !== undefined &&
  summary.weeksSinceDeload + 1 >= summary.deloadEveryWeeks;

const advance = (summary: WeekSummary): AdaptationNote => {
  const strong =
    summary.completionPct >= STRONG_THRESHOLD &&
    (summary.strengthProgressed || summary.cardioProgressed);
  return {
    action: "advance-week",
    details: { completionPct: round2(summary.completionPct) },
    explanation: strong
      ? `Advance to the next week: ${percent(summary.completionPct)} completion with measurable progress.`
      : `Advance to the next week: ${percent(summary.completionPct)} completion, progression on track.`,
  };
};

const percent = (fraction: number): string => `${Math.round(fraction * 100)}%`;

const round2 = (value: number): number => Math.round(value * 100) / 100;
