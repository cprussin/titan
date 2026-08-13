import { describe, expect, it } from "bun:test";
import type { AthleteState } from "@titan/db/athlete-state";
import type { Db } from "@titan/db/client";
import { weekDates } from "./week-dates";
import { loadWeekSchedule } from "./week-ribbon-data";

const db = {} as Db;
const today = "2026-08-13";

const noAthleteState = () => Promise.resolve(undefined);
const noProgramVersion = () => Promise.resolve(undefined);
const noSessions = () => Promise.resolve([]);
const noNames = () => Promise.resolve(new Map<string, string>());
const noHistory = () => Promise.resolve(new Map());

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
    );
    expect(requested).toEqual([]);
  });
});
