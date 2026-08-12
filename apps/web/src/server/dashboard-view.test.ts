import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import { dashboardView } from "./dashboard-view";
import type { LoggedSessionView } from "./logged-session-view";
import type { Today } from "./today";

const workout = (name: string): Today =>
  ({
    kind: "workout",
    resolved: {
      estimatedDurationMin: 62,
      prescribedExercises: [
        {
          prescription: Prescription.Strength({
            reps: 5,
            sets: 5,
            weight: 225,
          }),
        },
        {
          prescription: Prescription.Strength({
            reps: 8,
            sets: 3,
            weight: 155,
          }),
        },
      ],
    },
    template: { name },
  }) as unknown as Today;

const rest: Today = { kind: "rest" };
const noProgram: Today = { kind: "no-program" };

const loggedView: LoggedSessionView = {
  exercises: [],
  notes: ["Increase Back Squat from 225 lb to 230 lb next session."],
  summary: { avgRpe: "7.5", exerciseCount: 6, minutes: 58, totalSets: 22 },
};

const base = {
  action: { kind: "start" } as const,
  isFuture: false,
  isToday: true,
  logged: undefined,
  programName: "Athletic Health Foundation",
  weekCount: "W3 / 8",
  weekLabel: "TUE 11",
};

describe("dashboardView", () => {
  it("pre-workout today: program eyebrow, no status, start action, today's-session header", () => {
    const view = dashboardView({ ...base, selected: workout("Heavy Lower") });
    expect(view.eyebrow.programName).toBe("Athletic Health Foundation");
    expect(view.eyebrow.weekCount).toBe("W3 / 8");
    expect(view.eyebrow.status).toBeUndefined();
    expect(view.title).toBe("Heavy Lower");
    expect(view.primary).toEqual({
      action: { kind: "start" },
      kind: "start-workout",
    });
    expect(view.session?.label).toBe("Today's session");
    expect(view.session?.summary).toBe("2 exercises · 8 sets · ~62 min");
    expect(view.body.kind).toBe("prescription");
    expect(view.body.kind === "prescription" && view.body.loadHeader).toBe(
      "Load",
    );
  });

  it("future day: projected status, back-to-today, projected-load grid, caveat in summary", () => {
    const view = dashboardView({
      ...base,
      isFuture: true,
      isToday: false,
      selected: workout("Heavy Upper"),
      weekLabel: "FRI 14",
    });
    expect(view.eyebrow.status).toEqual({
      text: "FRI 14 · Projected",
      tone: "tertiary",
    });
    expect(view.primary).toEqual({ kind: "back-to-today" });
    expect(view.session?.label).toBe("Projected session");
    expect(view.session?.summary).toContain("loads adjust");
    expect(view.body.kind === "prescription" && view.body.loadHeader).toBe(
      "Projected load",
    );
  });

  it("past logged day: logged status, logged-session header with summary, log grid", () => {
    const view = dashboardView({
      ...base,
      isToday: false,
      logged: loggedView,
      selected: workout("Volume Upper"),
      weekLabel: "MON 10",
    });
    expect(view.eyebrow.status).toEqual({
      text: "MON 10 · Logged",
      tone: "success",
    });
    expect(view.title).toBe("Volume Upper");
    expect(view.primary).toEqual({ kind: "back-to-today" });
    expect(view.session?.label).toBe("Logged session");
    expect(view.session?.summary).toBe(
      "6 exercises · 22 sets · 58 min · avg RPE 7.5",
    );
    expect(view.body.kind).toBe("log");
  });

  it("today completed: complete status, no primary action, log grid", () => {
    const view = dashboardView({
      ...base,
      logged: loggedView,
      selected: workout("Heavy Lower"),
    });
    expect(view.eyebrow.status).toEqual({
      text: "Today · Complete",
      tone: "success",
    });
    expect(view.primary).toEqual({ kind: "none" });
    expect(view.session?.label).toBe("Today's session");
    expect(view.body.kind).toBe("log");
  });

  it("rest day today: rest status, recovery copy, no session block", () => {
    const view = dashboardView({ ...base, selected: rest });
    expect(view.eyebrow.status).toEqual({
      text: "Today · Rest",
      tone: "tertiary",
    });
    expect(view.title).toBe("Recovery");
    expect(view.primary).toEqual({ kind: "none" });
    expect(view.session).toBeUndefined();
    expect(view.body.kind).toBe("rest");
  });

  it("selected rest day away from today offers a way back", () => {
    const view = dashboardView({
      ...base,
      isToday: false,
      selected: rest,
      weekLabel: "WED 12",
    });
    expect(view.eyebrow.status?.text).toBe("WED 12 · Rest");
    expect(view.primary).toEqual({ kind: "back-to-today" });
  });

  it("no program: empty eyebrow, prompt title, rest body", () => {
    const view = dashboardView({ ...base, selected: noProgram });
    expect(view.eyebrow.programName).toBeUndefined();
    expect(view.title).toBe("No active program");
    expect(view.body.kind).toBe("rest");
  });
});
