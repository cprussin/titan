import type { Prescription } from "@titan/domain/prescription";
import type { PrescribedExercise } from "@titan/domain/workout-session";
import { isSetBased } from "../set-based-prescription";
import type { LoggedSessionView } from "./logged-session-view";
import type { Today } from "./today";
import type { AlternativeChoice, WorkoutAction } from "./workout-action";

/** The headline's primary action on the trailing edge. The weigh-in button
 *  lives beside it but is driven separately (it is always offered until logged),
 *  so it is not part of this. `fill-workout` logs a missed past day's session
 *  after the fact, dated to that day. */
export type DashboardPrimary =
  | { action: WorkoutAction; kind: "start-workout" }
  | {
      alternatives: readonly AlternativeChoice[];
      date: string;
      kind: "fill-workout";
    }
  | { kind: "back-to-today" }
  | { kind: "none" };

/** The body below the session header — the prescription ledger, the log, or a
 *  rest message. */
export type DashboardBody =
  | {
      exercises: readonly PrescribedExercise[];
      kind: "prescription";
      loadHeader: string;
    }
  | { kind: "log"; view: LoggedSessionView }
  | { copy: string; kind: "rest" };

/** The program the selected day belongs to: its name, and the block it sits in
 *  so the eyebrow can link to that block's detail page. */
export type DashboardProgram = {
  blockId: string;
  name: string;
  versionId: string;
};

/** The headline eyebrow's three baseline segments: the program (accent), the
 *  week count (mono), and — away from today's pre-workout state — where the
 *  selected day stands. */
export type DashboardEyebrow = {
  program: DashboardProgram | undefined;
  status: { text: string; tone: "success" | "tertiary" } | undefined;
  weekCount: string | undefined;
};

/** The session block's header line: which session, and its one-line summary. */
export type DashboardSession = { label: string; summary: string };

/** The whole dashboard for the selected day, decided in one place. */
export type DashboardView = {
  body: DashboardBody;
  eyebrow: DashboardEyebrow;
  primary: DashboardPrimary;
  session: DashboardSession | undefined;
  title: string;
};

export type DashboardViewInput = {
  /** The selected day's launch action, for an unlogged workout day. */
  action: WorkoutAction | undefined;
  /** The selected day. */
  date: string;
  isFuture: boolean;
  isToday: boolean;
  /** The completed session for the selected day, when one exists. */
  logged: LoggedSessionView | undefined;
  /** The active program and block, for the accent eyebrow segment. */
  program: DashboardProgram | undefined;
  /** The day the page is showing, resolved to its prescription/rest state. */
  selected: Today;
  /** "W3 / 8" for the selected day, when a program is placed. */
  weekCount: string | undefined;
  weekLabel: string;
};

const REST_COPY =
  "Recover well — walk, stretch, foam roll, or take an easy row under 20 minutes. No prescribed intensity today.";

const NO_PROGRAM_COPY =
  "No active program is placed. Load the bundled programs and place one to see today's session here.";

/**
 * Resolve the dashboard for one selected day. Pure: every branch — pre-workout,
 * a projected future day, a logged past day, today completed, a rest day, or no
 * program — is decided from the already-resolved inputs.
 */
export const dashboardView = (input: DashboardViewInput): DashboardView => {
  switch (input.selected.kind) {
    case "no-program": {
      return {
        body: { copy: NO_PROGRAM_COPY, kind: "rest" },
        eyebrow: {
          program: undefined,
          status: undefined,
          weekCount: undefined,
        },
        primary: { kind: "none" },
        session: undefined,
        title: "No active program",
      };
    }
    case "rest": {
      return restView(input);
    }
    case "workout": {
      return input.logged === undefined
        ? prescriptionView(input, input.selected)
        : loggedDayView(input, input.selected.template.name, input.logged);
    }
  }
};

/** A rest day — today's recovery message, or a selected rest day elsewhere in
 *  the week with a way back. */
const restView = (input: DashboardViewInput): DashboardView => ({
  body: { copy: REST_COPY, kind: "rest" },
  eyebrow: eyebrow(input, {
    text: input.isToday ? "Today · Rest" : `${input.weekLabel} · Rest`,
    tone: "tertiary",
  }),
  primary: input.isToday ? { kind: "none" } : { kind: "back-to-today" },
  session: undefined,
  title: "Recovery",
});

/** A day showing its prescription — today's to launch, a missed past day's
 *  to fill in, or a future day's engine projection. */
const prescriptionView = (
  input: DashboardViewInput,
  selected: Extract<Today, { kind: "workout" }>,
): DashboardView => {
  const projected = input.isFuture;
  const { estimatedDurationMin, prescribedExercises } = selected.resolved;
  return {
    body: {
      exercises: prescribedExercises,
      kind: "prescription",
      loadHeader: projected ? "Projected load" : "Load",
    },
    eyebrow: eyebrow(input, prescriptionStatus(input)),
    primary: prescriptionPrimary(input),
    session: {
      label: prescriptionLabel(input),
      summary: projected
        ? `${prescribedExercises.length} exercises · ~${estimatedDurationMin} min · loads adjust as earlier sessions are logged`
        : `${prescribedExercises.length} exercises · ${totalSets(prescribedExercises)} sets · ~${estimatedDurationMin} min`,
    },
    title: selected.template.name,
  };
};

/** A logged day — today's completion, or a past day's record. */
const loggedDayView = (
  input: DashboardViewInput,
  sessionName: string,
  logged: LoggedSessionView,
): DashboardView => ({
  body: { kind: "log", view: logged },
  eyebrow: eyebrow(input, {
    text: input.isToday ? "Today · Complete" : `${input.weekLabel} · Logged`,
    tone: "success",
  }),
  primary: input.isToday ? { kind: "none" } : { kind: "back-to-today" },
  session: {
    label: input.isToday ? "Today's session" : "Logged session",
    summary: loggedSummary(logged),
  },
  title: sessionName,
});

/** Assemble the eyebrow from the program segments and an optional status. */
const eyebrow = (
  input: DashboardViewInput,
  status: DashboardEyebrow["status"],
): DashboardEyebrow => ({
  program: input.program,
  status,
  weekCount: input.weekCount,
});

/** The pre-workout primary action: the launch control when there is one. */
const actionPrimary = (action: WorkoutAction | undefined): DashboardPrimary =>
  action === undefined ? { kind: "none" } : { action, kind: "start-workout" };

/** The prescription's eyebrow status: none today, otherwise whether the day is
 *  a projection ahead or a missed day behind. */
const prescriptionStatus = (
  input: DashboardViewInput,
): DashboardEyebrow["status"] => {
  if (input.isToday) {
    return undefined;
  } else {
    return {
      text: `${input.weekLabel} · ${input.isFuture ? "Projected" : "Missed"}`,
      tone: "tertiary",
    };
  }
};

/** The prescription's primary action: today launches, a future day only leads
 *  back, and a missed day is filled in. */
const prescriptionPrimary = (input: DashboardViewInput): DashboardPrimary => {
  if (input.isToday) {
    return actionPrimary(input.action);
  } else if (input.isFuture) {
    return { kind: "back-to-today" };
  } else {
    return missedPrimary(input.action, input.date);
  }
};

/** A missed day's action: fill it in, or continue a fill already under way. */
const missedPrimary = (
  action: WorkoutAction | undefined,
  date: string,
): DashboardPrimary => {
  switch (action?.kind) {
    case "start": {
      return { alternatives: action.alternatives, date, kind: "fill-workout" };
    }
    case "continue": {
      return { action, kind: "start-workout" };
    }
    case "done":
    case undefined: {
      return { kind: "back-to-today" };
    }
  }
};

/** The session block's label for a prescription day. */
const prescriptionLabel = (input: DashboardViewInput): string => {
  if (input.isToday) {
    return "Today's session";
  } else {
    return input.isFuture ? "Projected session" : "Missed session";
  }
};

/** The logged-session summary: exercises, sets, minutes, and average RPE when
 *  recorded. */
const loggedSummary = (logged: LoggedSessionView): string => {
  const { avgRpe, exerciseCount, minutes, totalSets: sets } = logged.summary;
  const rpe = avgRpe === undefined ? "" : ` · avg RPE ${avgRpe}`;
  return `${exerciseCount} exercises · ${sets} sets · ${minutes} min${rpe}`;
};

/** Total prescribed sets across a session's exercises — the rep-based pieces
 *  carry a set count; cardio contributes none. */
const totalSets = (exercises: readonly PrescribedExercise[]): number =>
  exercises.reduce(
    (sum, exercise) => sum + prescriptionSets(exercise.prescription),
    0,
  );

/** A prescription's set count, or 0 for the shapes that have none. */
const prescriptionSets = (prescription: Prescription): number =>
  isSetBased(prescription) ? prescription.sets : 0;
