import { deloadPrescription } from "@titan/adaptation-engine/deload";
import { estimatePlanMinutes } from "@titan/adaptation-engine/estimate-duration";
import { progressExercise } from "@titan/adaptation-engine/progress-exercise";
import type { AdaptationAction } from "@titan/domain/adaptation-decision";
import type { Prescription } from "@titan/domain/prescription";
import type { ExerciseSlot, SessionTemplate } from "@titan/domain/program";
import type { ExerciseResult } from "@titan/domain/result";
import type { PrescribedExercise } from "@titan/domain/workout-session";
import { selectVariant } from "./variant";
import { generateWarmup } from "./warmup";

/** A progression/deload decision for one slot, ready for the app to persist as
 *  an `AdaptationDecision` (it adds ids, user, and timestamps). */
export type SessionDecision = {
  action: AdaptationAction;
  details: Record<string, number> | undefined;
  exerciseId: string;
  explanation: string;
  slotId: string;
};

/** The fully resolved plan for one day's session. */
export type ResolvedSession = {
  decisions: readonly SessionDecision[];
  estimatedDurationMin: number;
  prescribedExercises: readonly PrescribedExercise[];
  variantLabel: string | undefined;
};

export type ResolveSessionInput = {
  /** The recorded history for a slot, oldest → newest. */
  historyBySlot: (slotId: string) => readonly ExerciseResult[];
  isDeloadWeek: boolean;
  template: SessionTemplate;
  /** 1-based week within the block (drives variant rotation). */
  weekInBlock: number;
};

/**
 * Resolve a session template into today's concrete plan: pick the week's
 * variant, run each slot's progression policy against its history (or hold and
 * cut volume on a deload week), generate barbell warm-ups, and total the
 * estimated duration. Pure — all inputs are passed in, and every adaptation is
 * returned as an explained {@link SessionDecision}.
 */
export const resolveSession = (input: ResolveSessionInput): ResolvedSession => {
  const { slots, label } = selectVariant(input.template, input.weekInBlock);
  const resolved = slots.map((slot) =>
    resolveSlot(slot, input.historyBySlot(slot.id), input.isDeloadWeek),
  );
  const prescribedExercises = resolved.map((entry) => entry.prescribed);
  return {
    decisions: resolved.map((entry) => entry.decision),
    estimatedDurationMin: Math.ceil(estimatePlanMinutes(prescribedExercises)),
    prescribedExercises,
    variantLabel: label,
  };
};

type ResolvedSlot = {
  decision: SessionDecision;
  prescribed: PrescribedExercise;
};

const resolveSlot = (
  slot: ExerciseSlot,
  history: readonly ExerciseResult[],
  isDeloadWeek: boolean,
): ResolvedSlot => {
  const { prescription, decision } = isDeloadWeek
    ? deloadSlot(slot, history)
    : progressSlot(slot, history);
  const previous = history.at(-1);
  const warmup =
    slot.generateWarmup && prescription.type === "strength"
      ? generateWarmup(prescription.weight, prescription.unit)
      : [];
  return {
    decision,
    prescribed: {
      exerciseId: slot.exerciseId,
      prescription,
      progression: slot.progression,
      role: slot.role,
      slotId: slot.id,
      ...(previous === undefined ? {} : { previous }),
      ...(warmup.length === 0 ? {} : { warmup }),
    },
  };
};

const progressSlot = (
  slot: ExerciseSlot,
  history: readonly ExerciseResult[],
): { decision: SessionDecision; prescription: Prescription } => {
  const outcome = progressExercise(slot.progression, slot.base, history);
  return {
    decision: {
      action: outcome.action,
      details: outcome.details,
      exerciseId: slot.exerciseId,
      explanation: outcome.explanation,
      slotId: slot.id,
    },
    prescription: outcome.prescription,
  };
};

const deloadSlot = (
  slot: ExerciseSlot,
  history: readonly ExerciseResult[],
): { decision: SessionDecision; prescription: Prescription } => {
  const held = history.at(-1)?.prescription ?? slot.base;
  return {
    decision: {
      action: "deload",
      details: undefined,
      exerciseId: slot.exerciseId,
      explanation:
        "Deload week: holding the load and cutting volume by ~40–50% while keeping the movement.",
      slotId: slot.id,
    },
    prescription: deloadPrescription(held),
  };
};
