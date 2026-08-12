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

/** One cell of the dashboard's week ribbon. Every cell carries where it sits in
 *  the week; its `kind` says what to show — a rest day, a planned session, or a
 *  session already logged. */
export type WeekDay = {
  date: string;
  dayOfWeek: number;
  isPast: boolean;
  isToday: boolean;
  label: string;
} & (
  | { kind: "rest" }
  | {
      kind: "planned";
      name: string;
      /** The primary-movement signature shown on a collapsed cell. */
      signature: string | undefined;
      /** The exercise count and duration shown on an expanded cell. */
      summary: string;
    }
  | {
      kind: "logged";
      name: string;
      /** The sets and actual duration shown on an expanded cell. */
      summary: string;
    }
);

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
  const common = {
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
    return {
      ...common,
      kind: "logged",
      name: loggedTemplate.name,
      summary: loggedSummary(logged),
    };
  } else {
    return resolvePlanned(input, common);
  }
};

const resolvePlanned = (
  input: WeekScheduleInput,
  common: Pick<WeekDay, "date" | "dayOfWeek" | "isPast" | "isToday" | "label">,
): WeekDay => {
  const position =
    input.programVersion === undefined
      ? undefined
      : resolvePosition(
          input.programVersion,
          input.absoluteWeek,
          common.dayOfWeek,
        );
  const template =
    position === undefined
      ? undefined
      : findTemplate(input.programVersion, position.sessionTemplateId);
  if (position === undefined || template === undefined) {
    return { ...common, kind: "rest" };
  } else {
    const resolved = resolveSession({
      historyBySlot: input.historyBySlot,
      isDeloadWeek: position.isDeloadWeek,
      template,
      weekInBlock: position.weekInBlock,
    });
    return {
      ...common,
      kind: "planned",
      name: template.name,
      signature: primarySignature(resolved.prescribedExercises, input.names),
      summary: `${resolved.prescribedExercises.length} exercises · ~${resolved.estimatedDurationMin} min`,
    };
  }
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
