import type { ProgramVersion } from "@titan/domain/program";
import type { ExerciseResult } from "@titan/domain/result";
import type { PrescribedExercise } from "@titan/domain/workout-session";
import { planDay } from "./today";

/** One way to train a planned day: the alternative it is reported by (absent for
 *  a session with one fixed shape), its label, the resolved plan, and why each
 *  exercise's target is what it is, keyed by exercise id. */
export type OfflineOption = {
  alternativeId: string | undefined;
  estimatedDurationMin: number;
  explanations: Record<string, string>;
  label: string | undefined;
  prescribedExercises: readonly PrescribedExercise[];
};

/** A training day the Android app can start without a connection. */
export type OfflinePlanDay = {
  date: string;
  options: readonly OfflineOption[];
  templateName: string;
};

export type OfflinePlanInput = {
  /** The absolute training week a date's calendar week lands on. */
  absoluteWeekFor: (date: string) => number;
  dates: readonly string[];
  historyBySlot: (slotId: string) => readonly ExerciseResult[];
  programVersion: ProgramVersion;
};

/**
 * The days ahead resolved exactly as starting them online would resolve them,
 * every alternative included, so the app can start any of them offline. Rest
 * days drop out: there is nothing to start. Pure.
 */
export const offlinePlan = (
  input: OfflinePlanInput,
): readonly OfflinePlanDay[] =>
  input.dates.flatMap((date) => {
    const day = planDay(
      input.programVersion,
      input.absoluteWeekFor(date),
      date,
      input.historyBySlot,
      undefined,
    );
    return day.kind === "workout"
      ? [
          {
            date,
            options: alternativesOf(day.template.alternatives).map(
              (alternative) =>
                option(input, date, alternative?.id, alternative?.label),
            ),
            templateName: day.template.name,
          },
        ]
      : [];
  });

/** The alternatives to resolve: each one offered, or the single fixed shape. */
const alternativesOf = (
  alternatives: readonly { id: string; label: string }[] | undefined,
): readonly ({ id: string; label: string } | undefined)[] =>
  alternatives === undefined || alternatives.length === 0
    ? [undefined]
    : alternatives;

const option = (
  input: OfflinePlanInput,
  date: string,
  alternativeId: string | undefined,
  label: string | undefined,
): OfflineOption => {
  const day = planDay(
    input.programVersion,
    input.absoluteWeekFor(date),
    date,
    input.historyBySlot,
    alternativeId,
  );
  if (day.kind === "workout") {
    return {
      alternativeId,
      estimatedDurationMin: day.resolved.estimatedDurationMin,
      explanations: Object.fromEntries(
        day.resolved.decisions.map((decision) => [
          decision.exerciseId,
          decision.explanation,
        ]),
      ),
      label,
      prescribedExercises: day.resolved.prescribedExercises,
    };
  } else {
    throw new Error(`${date} stopped resolving to a workout`);
  }
};
