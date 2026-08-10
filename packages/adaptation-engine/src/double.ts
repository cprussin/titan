import type { Prescription } from "@titan/domain/prescription";
import { Prescription as Rx } from "@titan/domain/prescription";
import type { DoublePolicy } from "@titan/domain/progression-policy";
import type { ExerciseResult } from "@titan/domain/result";
import { averageRpe, metRepTarget, mostRecent } from "./history";
import type { AdaptationOutcome } from "./outcome";

/** The prescription types double progression operates on — the base always
 *  narrows to one of these before any helper reads its load. */
type LoadedPrescription = Extract<
  Prescription,
  { type: "strength" } | { type: "bodyweight" }
>;

/**
 * Double progression: add reps within `[minReps, maxReps]` first; once the top
 * of the range is completed under the RPE cap, add weight and reset to the
 * bottom of the range. Works for both loaded (RDL) and bodyweight (weighted
 * pull-up) movements — the base prescription's type decides which dimension the
 * added load lives on. Loaded work stays in the base's unit (kg for barbell,
 * else lb); bodyweight added load is always lb.
 */
export const progressDouble = (
  policy: DoublePolicy,
  base: Prescription,
  priorResults: readonly ExerciseResult[],
): AdaptationOutcome => {
  if (base.type !== "strength" && base.type !== "bodyweight") {
    throw new Error(
      `double policy requires a strength or bodyweight base, got ${base.type}`,
    );
  } else {
    const last = mostRecent(priorResults);
    return last === undefined
      ? {
          action: "maintain",
          explanation: `Starting at ${describeLoad(base)} for ${policy.sets}×${policy.minReps}.`,
          prescription: base,
        }
      : decide(policy, base, last);
  }
};

const decide = (
  policy: DoublePolicy,
  base: LoadedPrescription,
  last: ExerciseResult,
): AdaptationOutcome => {
  const current = readLoad(last);
  const rpe = averageRpe(last);
  const overCap = rpe !== undefined && rpe > policy.rpeCap;

  if (!metRepTarget(last)) {
    return {
      action: "repeat",
      details: { reps: current.reps },
      explanation: `Repeat ${describeLoadValues(base, current)} for ${policy.sets}×${current.reps}: last session's reps weren't completed.`,
      prescription: build(base, policy.sets, current.reps, current.load),
    };
  } else if (current.reps >= policy.maxReps && !overCap) {
    const load = current.load + policy.increment;
    return {
      action: "increase-load",
      details: { from: current.load, reps: policy.minReps, to: load },
      explanation: `Add weight to ${describeLoadValues(base, { load, reps: policy.minReps })} and reset to ${policy.minReps} reps after completing ${policy.sets}×${policy.maxReps}.`,
      prescription: build(base, policy.sets, policy.minReps, load),
    };
  } else if (current.reps >= policy.maxReps) {
    return {
      action: "repeat",
      details: { avgRpe: rpe ?? 0, reps: current.reps },
      explanation: `Repeat ${policy.sets}×${policy.maxReps}: top of the rep range reached but RPE exceeded the ${policy.rpeCap} cap.`,
      prescription: build(base, policy.sets, current.reps, current.load),
    };
  } else {
    const reps = current.reps + 1;
    return {
      action: "increase-reps",
      details: { fromReps: current.reps, toReps: reps },
      explanation: `Increase to ${policy.sets}×${reps} (from ${current.reps}); add weight once ${policy.maxReps} reps are reached.`,
      prescription: build(base, policy.sets, reps, current.load),
    };
  }
};

type Load = { load: number; reps: number };

const readLoad = (result: ExerciseResult): Load => {
  const { prescription } = result;
  switch (prescription.type) {
    case "strength": {
      return { load: prescription.weight, reps: prescription.reps };
    }
    case "bodyweight": {
      return { load: prescription.addedWeightLb ?? 0, reps: prescription.reps };
    }
    default: {
      throw new Error(
        `double history expects a loaded/bodyweight prescription, got ${prescription.type}`,
      );
    }
  }
};

const build = (
  base: LoadedPrescription,
  sets: number,
  reps: number,
  load: number,
): Prescription =>
  base.type === "strength"
    ? Rx.Strength({
        reps,
        rpeTarget: base.rpeTarget,
        sets,
        unit: base.unit,
        weight: load,
      })
    : Rx.Bodyweight({
        ...(load > 0 ? { addedWeightLb: load } : {}),
        reps,
        sets,
      });

const describeLoad = (base: LoadedPrescription): string =>
  base.type === "strength"
    ? `${base.weight} ${base.unit}`
    : describeBodyweight(base.addedWeightLb ?? 0);

const describeLoadValues = (base: LoadedPrescription, load: Load): string =>
  base.type === "strength"
    ? `${load.load} ${base.unit}`
    : describeBodyweight(load.load);

const describeBodyweight = (addedLb: number): string =>
  addedLb === 0 ? "bodyweight" : `bodyweight +${addedLb} lb`;
