import type { Prescription } from "@titan/domain/prescription";
import type { PrescribedExercise } from "@titan/domain/workout-session";
import type { LoggedSessionView } from "./logged-session-view";
import type { Today } from "./today";
import type { WorkoutAction } from "./workout-action";

/** The headline's primary action on the trailing edge. The weigh-in button
 *  lives beside it but is driven separately (it is always offered until logged),
 *  so it is not part of this. */
export type DashboardPrimary =
  | { action: WorkoutAction; kind: "start-workout" }
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

/** The headline eyebrow's three baseline segments: the program name (accent),
 *  the week count (mono), and — away from today's pre-workout state — where the
 *  selected day stands. */
export type DashboardEyebrow = {
  programName: string | undefined;
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
  /** Today's launch action, for the pre-workout state. */
  action: WorkoutAction | undefined;
  isFuture: boolean;
  isToday: boolean;
  /** The completed session for the selected day, when one exists. */
  logged: LoggedSessionView | undefined;
  /** The active program's name, for the accent eyebrow segment. */
  programName: string | undefined;
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
          programName: undefined,
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

/** A day showing its prescription — today's to launch, or a future day's
 *  engine projection. */
const prescriptionView = (
  input: DashboardViewInput,
  selected: Extract<Today, { kind: "workout" }>,
): DashboardView => {
  const projected = !input.isToday;
  const { estimatedDurationMin, prescribedExercises } = selected.resolved;
  return {
    body: {
      exercises: prescribedExercises,
      kind: "prescription",
      loadHeader: projected ? "Projected load" : "Load",
    },
    eyebrow: eyebrow(
      input,
      projected
        ? { text: `${input.weekLabel} · Projected`, tone: "tertiary" }
        : undefined,
    ),
    primary: projected
      ? { kind: "back-to-today" }
      : actionPrimary(input.action),
    session: {
      label: projected ? "Projected session" : "Today's session",
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
  programName: input.programName,
  status,
  weekCount: input.weekCount,
});

/** The pre-workout primary action: the launch control when there is one. */
const actionPrimary = (action: WorkoutAction | undefined): DashboardPrimary =>
  action === undefined ? { kind: "none" } : { action, kind: "start-workout" };

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
  prescription.type === "strength" ||
  prescription.type === "bodyweight" ||
  prescription.type === "timed-hold"
    ? prescription.sets
    : 0;
