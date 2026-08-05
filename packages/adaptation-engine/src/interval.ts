import type { Prescription } from "@titan/domain/prescription";
import { Prescription as Rx } from "@titan/domain/prescription";
import type { IntervalPolicy } from "@titan/domain/progression-policy";
import type { ExerciseResult } from "@titan/domain/result";
import { mostRecent } from "./history";
import type { AdaptationOutcome } from "./outcome";

/**
 * Interval progression: advance the target split by `paceImprovementSecPer500`
 * only when every interval was completed AND the spread between the fastest and
 * slowest interval stayed within `maxDegradationSecPer500`. Otherwise repeat the
 * target. Pace and volume never advance together (the volume is fixed by the
 * program's weekly rotation), satisfying the spec's interval rule.
 */
export const progressInterval = (
  policy: IntervalPolicy,
  base: Prescription,
  priorResults: readonly ExerciseResult[],
): AdaptationOutcome => {
  if (base.type === "intervals") {
    const last = mostRecent(priorResults);
    return last === undefined || last.prescription.type !== "intervals"
      ? {
          action: "maintain",
          explanation: `Starting intervals${base.targetSplitSecPer500 === undefined ? "" : ` at ${formatSplit(base.targetSplitSecPer500)}`}.`,
          prescription: base,
        }
      : decide(policy, base, last, last.prescription);
  } else {
    throw new Error(
      `interval policy requires an intervals base, got ${base.type}`,
    );
  }
};

const decide = (
  policy: IntervalPolicy,
  base: Prescription & { type: "intervals" },
  last: ExerciseResult,
  lastPrescription: Extract<Prescription, { type: "intervals" }>,
): AdaptationOutcome => {
  const splits = (last.intervals ?? [])
    .map((interval) => interval.splitSecPer500)
    .filter((split): split is number => split !== undefined);
  const completed = (last.intervals ?? []).length;
  const degradation =
    splits.length > 0 ? Math.max(...splits) - Math.min(...splits) : 0;
  const currentTarget =
    lastPrescription.targetSplitSecPer500 ?? averageSplit(splits);

  const advanced =
    completed >= lastPrescription.count &&
    degradation <= policy.maxDegradationSecPer500 &&
    currentTarget !== undefined;

  const at = (targetSplitSecPer500: number | undefined): Prescription =>
    Rx.Intervals({
      count: base.count,
      recoverySec: base.recoverySec,
      ...(targetSplitSecPer500 === undefined ? {} : { targetSplitSecPer500 }),
      ...(base.workDistanceMeters === undefined
        ? {}
        : { workDistanceMeters: base.workDistanceMeters }),
      ...(base.workSec === undefined ? {} : { workSec: base.workSec }),
    });

  if (advanced && currentTarget !== undefined) {
    const next = currentTarget - policy.paceImprovementSecPer500;
    return {
      action: "advance-pace",
      details: { degradation, fromSplit: currentTarget, toSplit: next },
      explanation: `Advance target split from ${formatSplit(currentTarget)} to ${formatSplit(next)}: all intervals completed with only ${round1(degradation)}s of drift.`,
      prescription: at(next),
    };
  } else {
    return {
      action: "repeat",
      details: { completed, degradation },
      explanation: `Repeat the target split: ${completed}/${lastPrescription.count} intervals completed with ${round1(degradation)}s of drift.`,
      prescription: at(currentTarget),
    };
  }
};

const averageSplit = (splits: readonly number[]): number | undefined =>
  splits.length === 0
    ? undefined
    : splits.reduce((sum, split) => sum + split, 0) / splits.length;

const formatSplit = (secondsPer500: number): string => {
  const whole = Math.round(secondsPer500 * 10) / 10;
  const mins = Math.floor(whole / 60);
  const secs = (whole - mins * 60).toFixed(1).padStart(4, "0");
  return `${mins}:${secs}/500m`;
};

const round1 = (value: number): number => Math.round(value * 10) / 10;
