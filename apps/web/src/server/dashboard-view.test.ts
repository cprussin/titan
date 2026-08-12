import { describe, expect, it } from "bun:test";
import { dashboardView } from "./dashboard-view";
import type { LoggedSessionView } from "./logged-session-view";
import type { Today } from "./today";

const workout = (name: string): Today =>
  ({
    kind: "workout",
    resolved: { prescribedExercises: [{ slotId: "a" }] },
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
  nextLabel: undefined,
  programContext: "Athletic Health Foundation · Week 3 of 8",
  weekLabel: "TUE 11",
};

describe("dashboardView", () => {
  it("pre-workout today: accent program eyebrow, session title, start action, prescription grid", () => {
    const view = dashboardView({ ...base, selected: workout("Heavy Lower") });
    expect(view.eyebrow).toBe("Athletic Health Foundation · Week 3 of 8");
    expect(view.eyebrowTone).toBe("accent");
    expect(view.title).toBe("Heavy Lower");
    expect(view.subtitle).toBeUndefined();
    expect(view.trailing).toEqual({
      action: { kind: "start" },
      kind: "start-workout",
    });
    expect(view.body.kind).toBe("prescription");
    expect(view.body.kind === "prescription" && view.body.loadHeader).toBe(
      "Load",
    );
  });

  it("future day: projected eyebrow, back-to-today, projected-load grid with a note", () => {
    const view = dashboardView({
      ...base,
      isFuture: true,
      isToday: false,
      selected: workout("Heavy Upper"),
      weekLabel: "FRI 14",
    });
    expect(view.eyebrow).toBe(
      "FRI 14 · Projected · Athletic Health Foundation · Week 3 of 8",
    );
    expect(view.eyebrowTone).toBe("tertiary");
    expect(view.trailing).toEqual({ kind: "back-to-today" });
    expect(view.body.kind === "prescription" && view.body.loadHeader).toBe(
      "Projected load",
    );
    expect(view.body.kind === "prescription" && view.body.note).toContain(
      "Heavy Upper",
    );
  });

  it("past logged day: logged eyebrow, summary subtitle, back-to-today, log grid", () => {
    const view = dashboardView({
      ...base,
      isToday: false,
      logged: loggedView,
      selected: workout("Volume Upper"),
      weekLabel: "MON 10",
    });
    expect(view.eyebrow).toBe(
      "MON 10 · Logged · Athletic Health Foundation · Week 3 of 8",
    );
    expect(view.eyebrowTone).toBe("success");
    expect(view.title).toBe("Volume Upper");
    expect(view.subtitle).toBe("6 exercises · 22 sets · 58 min · avg RPE 7.5");
    expect(view.trailing).toEqual({ kind: "back-to-today" });
    expect(view.body.kind).toBe("log");
  });

  it("today completed: complete eyebrow, done title, completed trailing, log grid", () => {
    const view = dashboardView({
      ...base,
      logged: loggedView,
      nextLabel: "Row Intervals · Thu 13",
      selected: workout("Heavy Lower"),
    });
    expect(view.eyebrow).toBe(
      "Today · Complete · Athletic Health Foundation · Week 3 of 8",
    );
    expect(view.eyebrowTone).toBe("success");
    expect(view.title).toBe("Heavy Lower done");
    expect(view.trailing.kind).toBe("completed");
    expect(view.trailing.kind === "completed" && view.trailing.nextLabel).toBe(
      "Row Intervals · Thu 13",
    );
    expect(view.body.kind).toBe("log");
  });

  it("rest day today: rest eyebrow and copy, no trailing", () => {
    const view = dashboardView({ ...base, selected: rest });
    expect(view.eyebrow).toBe("Today · Rest");
    expect(view.title).toBe("Recovery");
    expect(view.trailing).toEqual({ kind: "none" });
    expect(view.body.kind).toBe("rest");
  });

  it("selected rest day away from today offers a way back", () => {
    const view = dashboardView({
      ...base,
      isToday: false,
      selected: rest,
      weekLabel: "WED 12",
    });
    expect(view.eyebrow).toBe("WED 12 · Rest");
    expect(view.eyebrowTone).toBe("tertiary");
    expect(view.trailing).toEqual({ kind: "back-to-today" });
  });

  it("no program: prompt title and rest body", () => {
    const view = dashboardView({ ...base, selected: noProgram });
    expect(view.title).toBe("No active program");
    expect(view.body.kind).toBe("rest");
  });
});
