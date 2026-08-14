import type { LoadUnit } from "@titan/domain/load-unit";
import type { Prescription } from "@titan/domain/prescription";
import { Prescription as Rx } from "@titan/domain/prescription";
import type {
  RpeBand,
  RpeBandedPolicy,
} from "@titan/domain/progression-policy";
import type { ExerciseResult } from "@titan/domain/result";
import {
  completedWeight,
  finalSetRpe,
  metRepTarget,
  mostRecent,
} from "./history";
import type { AdaptationOutcome } from "./outcome";

/**
 * RPE-banded progression — the reentry / regaining-strength policy. With no
 * history the base weight stands. Otherwise, judged against the last session's
 * final working set:
 *
 * - reps met and a band covers the final-set RPE → add that band's increment
 * - reps met but the final-set RPE is above every band → repeat the weight
 * - reps met but no final-set RPE was recorded → repeat (the load step is
 *   RPE-gated, so an unrecorded RPE can't justify a jump)
 * - reps missed → repeat the weight
 *
 * The band table expresses the whole schedule — larger steps at low RPE, and
 * distinct upper/lower increments — so there is no separate RPE cap. Only the
 * fixed `sets`/`reps` come from the policy; the load tracks recorded history in
 * the exercise's unit (kg for barbell, else lb).
 */
export const progressRpeBanded = (
  policy: RpeBandedPolicy,
  base: Prescription,
  priorResults: readonly ExerciseResult[],
): AdaptationOutcome => {
  if (base.type === "strength") {
    const last = mostRecent(priorResults);
    return last === undefined
      ? {
          action: "maintain",
          explanation: `Starting at ${base.weight} ${base.unit} for ${policy.sets}×${policy.reps}.`,
          prescription: base,
        }
      : decideFromLast(policy, base.unit, last);
  } else {
    throw new Error(
      `rpe-banded policy requires a strength base, got ${base.type}`,
    );
  }
};

const decideFromLast = (
  policy: RpeBandedPolicy,
  unit: LoadUnit,
  last: ExerciseResult,
): AdaptationOutcome => {
  const lastWeight = completedWeight(last);
  const at = (weight: number): Prescription =>
    Rx.Strength({ reps: policy.reps, sets: policy.sets, unit, weight });
  if (metRepTarget(last)) {
    return decideFromRpe(policy, unit, lastWeight, finalSetRpe(last), at);
  } else {
    return {
      action: "repeat",
      details: { weight: lastWeight },
      explanation: `Repeat ${lastWeight} ${unit}: reps were missed last session.`,
      prescription: at(lastWeight),
    };
  }
};

const decideFromRpe = (
  policy: RpeBandedPolicy,
  unit: LoadUnit,
  lastWeight: number,
  rpe: number | undefined,
  at: (weight: number) => Prescription,
): AdaptationOutcome => {
  const band = rpe === undefined ? undefined : selectBand(policy.bands, rpe);
  if (rpe === undefined) {
    return {
      action: "repeat",
      details: { weight: lastWeight },
      explanation: `Repeat ${lastWeight} ${unit}: no final-set RPE was recorded, so the load holds until effort is known.`,
      prescription: at(lastWeight),
    };
  } else if (band === undefined) {
    return {
      action: "repeat",
      details: { finalRpe: rpe, weight: lastWeight },
      explanation: `Repeat ${lastWeight} ${unit}: final-set RPE ${round1(rpe)} was above every progression band.`,
      prescription: at(lastWeight),
    };
  } else {
    const next = lastWeight + band.increment;
    return {
      action: "increase-load",
      details: {
        finalRpe: rpe,
        from: lastWeight,
        increment: band.increment,
        to: next,
      },
      explanation: `Increase from ${lastWeight} ${unit} to ${next} ${unit}: final-set RPE ${round1(rpe)} was at or below ${band.maxRpe}.`,
      prescription: at(next),
    };
  }
};

/** The tightest band whose ceiling covers `rpe` (smallest `maxRpe` still ≥
 *  `rpe`), or `undefined` when `rpe` exceeds every band. */
const selectBand = (
  bands: readonly RpeBand[],
  rpe: number,
): RpeBand | undefined =>
  bands
    .filter((band) => rpe <= band.maxRpe)
    .reduce<RpeBand | undefined>(
      (tightest, band) =>
        tightest === undefined || band.maxRpe < tightest.maxRpe
          ? band
          : tightest,
      undefined,
    );

const round1 = (value: number): number => Math.round(value * 10) / 10;
