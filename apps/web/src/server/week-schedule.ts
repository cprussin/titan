import type { ProgramVersion, SessionTemplate } from "@titan/domain/program";
import type { ExerciseResult } from "@titan/domain/result";
import type {
  PrescribedExercise,
  WorkoutSession,
} from "@titan/domain/workout-session";
import { resolveSession } from "@titan/program-engine/resolve-session";
import { resolvePosition } from "@titan/program-engine/schedule";
import { isoDayOfWeek } from "../date";
import { prescriptionColumns } from "../prescription-columns";
import { sessionDurationMin } from "../session-duration";
import { dayLabel } from "./week-dates";
import type { WeekDayBase } from "./week-day";
import { WeekDay, weekDaySchema } from "./week-day";

export { WeekDay, weekDaySchema };

/** Everything the pure resolver needs, gathered once by the page so the ribbon
 *  reads a single set of DB rows rather than re-querying per day. */
export type WeekScheduleInput = {
  /** The athlete's current absolute training week — every day of the ribbon
   *  shares it, differing only by weekday. */
  absoluteWeek: number;
  historyBySlot: (slotId: string) => readonly ExerciseResult[];
  loggedByDate: ReadonlyMap<string, WorkoutSession>;
  names: ReadonlyMap<string, string>;
  programVersion: ProgramVersion | undefined;
  today: string;
  weekDates: readonly string[];
};

/**
 * Resolve every day of the visible week into a ribbon cell. Pure and
 * deterministic: a logged session wins (the day reads as done), otherwise the
 * program is resolved for that weekday to a planned session or a rest day.
 */
export const weekSchedule = (input: WeekScheduleInput): readonly WeekDay[] =>
  input.weekDates.map((date) => resolveDay(input, date));

const resolveDay = (input: WeekScheduleInput, date: string): WeekDay => {
  const base = {
    date,
    dayOfWeek: isoDayOfWeek(date),
    isPast: date < input.today,
    isToday: date === input.today,
    label: dayLabel(date),
  };
  const logged = input.loggedByDate.get(date);
  const loggedTemplate =
    logged === undefined
      ? undefined
      : findTemplate(input.programVersion, logged.sessionTemplateId);
  if (logged !== undefined && loggedTemplate !== undefined) {
    return WeekDay.Logged(base, loggedTemplate.name, loggedSummary(logged));
  } else {
    return resolvePlanned(input, base);
  }
};

const resolvePlanned = (
  input: WeekScheduleInput,
  base: WeekDayBase,
): WeekDay => {
  const position =
    input.programVersion === undefined
      ? undefined
      : resolvePosition(
          input.programVersion,
          input.absoluteWeek,
          base.dayOfWeek,
        );
  const template =
    position === undefined
      ? undefined
      : findTemplate(input.programVersion, position.sessionTemplateId);
  if (position === undefined || template === undefined) {
    return WeekDay.Rest(base);
  } else {
    const resolved = resolveSession({
      historyBySlot: input.historyBySlot,
      isDeloadWeek: position.isDeloadWeek,
      template,
      weekInBlock: position.weekInBlock,
    });
    return WeekDay.Planned(
      base,
      template.name,
      primarySignature(resolved.prescribedExercises, input.names),
      `${resolved.prescribedExercises.length} exercises · ~${resolved.estimatedDurationMin} min`,
    );
  }
};

/** Completed sessions keyed by their scheduled date, for the ribbon's
 *  logged-day lookup. */
export const completedSessionsByDate = (
  sessions: readonly WorkoutSession[],
): ReadonlyMap<string, WorkoutSession> => {
  const byDate = new Map<string, WorkoutSession>();
  for (const session of sessions) {
    if (session.status === "completed") {
      byDate.set(session.scheduledDate, session);
    }
  }
  return byDate;
};

/** The template a session id points at within the current program version, or
 *  `undefined` when the version is absent or predates it. */
const findTemplate = (
  programVersion: ProgramVersion | undefined,
  sessionTemplateId: string | undefined,
): SessionTemplate | undefined =>
  programVersion === undefined || sessionTemplateId === undefined
    ? undefined
    : programVersion.sessionTemplates.find(
        (template) => template.id === sessionTemplateId,
      );

/** A logged day's expanded summary: how many sets, and how long it actually
 *  took (falling back to the estimate for sessions logged without timestamps). */
const loggedSummary = (session: WorkoutSession): string => {
  const sets = session.results.reduce(
    (total, result) => total + result.sets.length,
    0,
  );
  return `${sets} sets · ${sessionDurationMin(session)} min`;
};

/** A planned day's ribbon detail: the primary movement's target — named for
 *  strength work (`Back Squat 5×5`), bare for cardio (`8 × 500 m`). */
const primarySignature = (
  exercises: readonly PrescribedExercise[],
  names: ReadonlyMap<string, string>,
): string | undefined => {
  const primary =
    exercises.find((exercise) => exercise.role === "primary") ?? exercises[0];
  if (primary === undefined) {
    return undefined;
  } else {
    const { scheme } = prescriptionColumns(primary.prescription);
    return isNamedTarget(primary.prescription.type)
      ? `${names.get(primary.exerciseId) ?? primary.exerciseId} ${scheme}`
      : scheme;
  }
};

/** Whether a prescription's signature reads better with the exercise name — the
 *  weight-room movements — versus a self-describing cardio target. */
const isNamedTarget = (
  type: PrescribedExercise["prescription"]["type"],
): boolean =>
  type === "strength" || type === "bodyweight" || type === "timed-hold";
