import type { PrescribedExercise } from "@titan/domain/workout-session";
import type { LoggedSessionView } from "./logged-session-view";
import type { Today } from "./today";
import type { WorkoutAction } from "./workout-action";

/** What the header's trailing edge carries, decided with the rest of the view so
 *  the page only has to render it. */
export type DashboardTrailing =
  | { action: WorkoutAction; kind: "start-workout" }
  | { kind: "back-to-today" }
  | { kind: "completed"; nextLabel: string | undefined; recovery: string }
  | { kind: "none" };

/** What sits below the header — the prescription ledger, the log, or a rest
 *  message. */
export type DashboardBody =
  | {
      exercises: readonly PrescribedExercise[];
      kind: "prescription";
      loadHeader: string;
      note: string | undefined;
    }
  | { kind: "log"; view: LoggedSessionView }
  | { copy: string; kind: "rest" };

/** The whole dashboard for the selected day, decided in one place: the header
 *  copy and tone, its trailing action, and the body. */
export type DashboardView = {
  body: DashboardBody;
  eyebrow: string;
  eyebrowTone: "accent" | "success" | "tertiary";
  subtitle: string | undefined;
  title: string;
  trailing: DashboardTrailing;
};

export type DashboardViewInput = {
  /** Today's launch action, for the pre-workout state. */
  action: WorkoutAction | undefined;
  isFuture: boolean;
  isToday: boolean;
  /** The completed session for the selected day, when one exists. */
  logged: LoggedSessionView | undefined;
  /** The next training day's label, for the completed state ("Row Intervals ·
   *  Thu 13"). */
  nextLabel: string | undefined;
  /** "{Program} · Week X of Y" for the selected day, when a program is placed. */
  programContext: string | undefined;
  /** The day the page is showing, resolved to its prescription/rest/no-program
   *  state. */
  selected: Today;
  weekLabel: string;
};

const REST_COPY =
  "Recover well — walk, stretch, foam roll, or take an easy row under 20 minutes. No prescribed intensity today.";

const NO_PROGRAM_COPY =
  "No active program is placed. Load the bundled programs and place one to see today's session here.";

const RECOVERY_LINE =
  "Recover well — walk, stretch, or take an easy row under 20 minutes.";

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
        eyebrow: "Today",
        eyebrowTone: "accent",
        subtitle: undefined,
        title: "No active program",
        trailing: { kind: "none" },
      };
    }
    case "rest": {
      return restView(input);
    }
    case "workout": {
      return input.logged === undefined
        ? prescriptionView(input, input.selected.template.name, input.selected)
        : loggedDayView(input, input.selected.template.name, input.logged);
    }
  }
};

/** A rest day — today's recovery message, or a selected rest day elsewhere in
 *  the week with a way back. */
const restView = (input: DashboardViewInput): DashboardView => ({
  body: { copy: REST_COPY, kind: "rest" },
  eyebrow: input.isToday ? "Today · Rest" : `${input.weekLabel} · Rest`,
  eyebrowTone: input.isToday ? "accent" : "tertiary",
  subtitle: undefined,
  title: "Recovery",
  trailing: input.isToday ? { kind: "none" } : { kind: "back-to-today" },
});

/** A day showing its prescription — today's to launch, or a future day's
 *  engine projection. */
const prescriptionView = (
  input: DashboardViewInput,
  sessionName: string,
  selected: Extract<Today, { kind: "workout" }>,
): DashboardView => {
  const projected = !input.isToday;
  return {
    body: {
      exercises: selected.resolved.prescribedExercises,
      kind: "prescription",
      loadHeader: projected ? "Projected load" : "Load",
      note: projected
        ? `Projected from your last ${sessionName}: loads will adjust as this week's earlier sessions are logged.`
        : undefined,
    },
    eyebrow: projected
      ? `${input.weekLabel} · Projected · ${input.programContext}`
      : (input.programContext ?? "Today"),
    eyebrowTone: projected ? "tertiary" : "accent",
    subtitle: undefined,
    title: sessionName,
    trailing: input.isToday
      ? actionTrailing(input.action)
      : { kind: "back-to-today" },
  };
};

/** A logged day — today's completion, or a past day's record. */
const loggedDayView = (
  input: DashboardViewInput,
  sessionName: string,
  logged: LoggedSessionView,
): DashboardView => ({
  body: { kind: "log", view: logged },
  eyebrow: input.isToday
    ? `Today · Complete · ${input.programContext}`
    : `${input.weekLabel} · Logged · ${input.programContext}`,
  eyebrowTone: "success",
  subtitle: summaryLine(logged),
  title: input.isToday ? `${sessionName} done` : sessionName,
  trailing: input.isToday
    ? { kind: "completed", nextLabel: input.nextLabel, recovery: RECOVERY_LINE }
    : { kind: "back-to-today" },
});

/** The pre-workout trailing action: the launch control when there is one,
 *  otherwise nothing. */
const actionTrailing = (
  action: WorkoutAction | undefined,
): DashboardTrailing =>
  action === undefined ? { kind: "none" } : { action, kind: "start-workout" };

/** The logged-session header line: exercises, sets, minutes, and average RPE
 *  when it was recorded. */
const summaryLine = (logged: LoggedSessionView): string => {
  const { avgRpe, exerciseCount, minutes, totalSets } = logged.summary;
  const rpe = avgRpe === undefined ? "" : ` · avg RPE ${avgRpe}`;
  return `${exerciseCount} exercises · ${totalSets} sets · ${minutes} min${rpe}`;
};
