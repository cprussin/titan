import { describe, expect, it } from "bun:test";
import type { AthleteState } from "@titan/db/athlete-state";
import type { Db } from "@titan/db/client";
import { Prescription } from "@titan/domain/prescription";
import type { ProgramVersion, SessionTemplate } from "@titan/domain/program";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import { weekDates } from "./week-dates";
import { loadWeekSchedule } from "./week-ribbon-data";

const db = {} as Db;
const today = "2026-08-13";

const noAthleteState = () => Promise.resolve(undefined);
const noProgramVersion = () => Promise.resolve(undefined);
const noSessions = () => Promise.resolve([]);
const noNames = () => Promise.resolve(new Map<string, string>());
const noHistory = () => Promise.resolve(new Map());
const noCompletedDates = () => Promise.resolve([]);

/** A Monday-only session template, enough for a ribbon cell to resolve. */
const mondaySession = (id: string, name: string): SessionTemplate => ({
  constraints: { preferredDay: 1 },
  id,
  name,
  slots: [
    {
      base: Prescription.Strength({
        reps: 5,
        sets: 5,
        unit: "kg",
        weight: 100,
      }),
      exerciseId: "back-squat",
      generateWarmup: false,
      id: `${id}-back-squat`,
      progression: ProgressionPolicy.None(),
      role: "primary",
    },
  ],
  tags: [],
  targetDurationMin: 60,
});

/** A four-week reentry block that hands off to a foundation block, as Athletic
 *  Health Foundation does. */
const programVersion: ProgramVersion = {
  blocks: [
    {
      durationWeeks: 4,
      id: "reentry",
      name: "Strength Reentry",
      weekTemplate: {
        days: [{ dayOfWeek: 1, sessionTemplateId: "reentry-mon" }],
      },
    },
    {
      durationWeeks: 8,
      id: "foundation",
      name: "Foundation",
      weekTemplate: {
        days: [{ dayOfWeek: 1, sessionTemplateId: "foundation-mon" }],
      },
    },
  ],
  createdAt: "2026-01-01T00:00:00.000Z",
  id: "ahf-v1",
  programId: "ahf",
  sessionTemplates: [
    mondaySession("reentry-mon", "Reentry Strength"),
    mondaySession("foundation-mon", "Heavy Lower"),
  ],
  version: 1,
};

describe("loadWeekSchedule", () => {
  it("resolves a cell for each date of the requested week offset", async () => {
    const week = await loadWeekSchedule(
      db,
      "u1",
      today,
      2,
      noAthleteState,
      noProgramVersion,
      noSessions,
      noNames,
      noHistory,
      noCompletedDates,
    );
    expect(week.map((day) => day.date)).toEqual([...weekDates(today, 2)]);
    expect(week.every((day) => day.kind === "rest")).toBe(true);
  });

  it("looks up the program version named by the athlete's state", async () => {
    const requested: string[] = [];
    const state = {
      absoluteWeek: 4,
      programVersionId: "ahf-v1",
    } as AthleteState;
    await loadWeekSchedule(
      db,
      "u1",
      today,
      0,
      () => Promise.resolve(state),
      (_db, id) => {
        requested.push(id);
        return Promise.resolve(undefined);
      },
      noSessions,
      noNames,
      noHistory,
      noCompletedDates,
    );
    expect(requested).toEqual(["ahf-v1"]);
  });

  it("does not look up a program version when no state is placed", async () => {
    const requested: string[] = [];
    await loadWeekSchedule(
      db,
      "u1",
      today,
      0,
      noAthleteState,
      (_db, id) => {
        requested.push(id);
        return Promise.resolve(undefined);
      },
      noSessions,
      noNames,
      noHistory,
      noCompletedDates,
    );
    expect(requested).toEqual([]);
  });

  it("moves the block on once the athlete has trained the weeks it lasts", async () => {
    const state = {
      absoluteWeek: 1,
      placedOn: "2026-08-10",
      programVersionId: "ahf-v1",
    } as AthleteState;
    const week = await loadWeekSchedule(
      db,
      "u1",
      "2026-09-07",
      0,
      () => Promise.resolve(state),
      () => Promise.resolve(programVersion),
      noSessions,
      noNames,
      noHistory,
      () =>
        Promise.resolve(
          ["2026-08-12", "2026-08-19", "2026-08-26", "2026-09-02"].map(
            (scheduledDate) => ({ programVersionId: "ahf-v1", scheduledDate }),
          ),
        ),
    );
    const [monday] = week;
    expect(monday?.kind).toBe("planned");
    expect(monday?.kind === "planned" ? monday.name : undefined).toBe(
      "Heavy Lower",
    );
  });
});
