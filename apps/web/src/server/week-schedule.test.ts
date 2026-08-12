import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import type {
  ExerciseSlot,
  ProgramVersion,
  SessionTemplate,
  TrainingBlock,
} from "@titan/domain/program";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import type { WorkoutSession } from "@titan/domain/workout-session";
import { weekSchedule } from "./week-schedule";

const strengthSlot = (id: string): ExerciseSlot => ({
  base: Prescription.Strength({ reps: 5, sets: 5, weight: 225 }),
  exerciseId: "squat-ex",
  generateWarmup: false,
  id,
  progression: ProgressionPolicy.None(),
  role: "primary",
});

const accessorySlot = (id: string): ExerciseSlot => ({
  base: Prescription.Bodyweight({ reps: 12, sets: 3 }),
  exerciseId: "calf-ex",
  generateWarmup: false,
  id,
  progression: ProgressionPolicy.None(),
  role: "accessory",
});

const intervalSlot: ExerciseSlot = {
  base: Prescription.Intervals({
    count: 8,
    recoverySec: 90,
    workDistanceMeters: 500,
  }),
  exerciseId: "row-ex",
  generateWarmup: false,
  id: "row-slot",
  progression: ProgressionPolicy.None(),
  role: "primary",
};

const heavyLower: SessionTemplate = {
  constraints: {},
  id: "heavy-lower",
  name: "Heavy Lower",
  slots: [strengthSlot("squat-slot"), accessorySlot("calf-slot")],
  tags: [],
  targetDurationMin: 60,
};

const rowIntervals: SessionTemplate = {
  constraints: {},
  id: "row-intervals",
  name: "Row Intervals",
  slots: [intervalSlot],
  tags: [],
  targetDurationMin: 40,
};

const block: TrainingBlock = {
  durationWeeks: 8,
  id: "base-block",
  name: "Athletic Health Foundation",
  weekTemplate: {
    days: [
      { dayOfWeek: 1, sessionTemplateId: "heavy-lower" },
      { dayOfWeek: 2, sessionTemplateId: "row-intervals" },
    ],
  },
};

const version: ProgramVersion = {
  blocks: [block],
  createdAt: "2026-01-01T00:00:00.000Z",
  id: "ahf-v1",
  programId: "ahf",
  sessionTemplates: [heavyLower, rowIntervals],
  version: 1,
};

const names = new Map([
  ["squat-ex", "Back Squat"],
  ["row-ex", "Row"],
  ["calf-ex", "Standing Calf Raise"],
]);

const dates = [
  "2026-08-10",
  "2026-08-11",
  "2026-08-12",
  "2026-08-13",
  "2026-08-14",
  "2026-08-15",
  "2026-08-16",
];

const loggedHeavyLower: WorkoutSession = {
  completedAt: "2026-08-10T18:45:00.000Z",
  estimatedDurationMin: 60,
  results: [{ sets: [{}, {}, {}, {}, {}] }, { sets: [{}, {}, {}] }],
  scheduledDate: "2026-08-10",
  sessionTemplateId: "heavy-lower",
  startedAt: "2026-08-10T18:00:00.000Z",
  status: "completed",
} as unknown as WorkoutSession;

const base = {
  absoluteWeek: 3,
  historyBySlot: () => [],
  names,
  programVersion: version,
  today: "2026-08-10",
  weekDates: dates,
};

describe("weekSchedule", () => {
  it("labels and dates all seven days of the week", () => {
    const week = weekSchedule({ ...base, loggedByDate: new Map() });
    expect(week).toHaveLength(7);
    expect(week[0]).toMatchObject({ date: "2026-08-10", label: "MON 10" });
    expect(week.at(-1)).toMatchObject({ date: "2026-08-16", label: "SUN 16" });
  });

  it("marks today and past days", () => {
    const week = weekSchedule({
      ...base,
      loggedByDate: new Map(),
      today: "2026-08-12",
    });
    expect(week[2]).toMatchObject({ date: "2026-08-12", isToday: true });
    expect(week[0]).toMatchObject({ isPast: true, isToday: false });
    expect(week[3]).toMatchObject({ isPast: false, isToday: false });
  });

  it("summarizes today's planned session by exercise count and duration", () => {
    const monday = weekSchedule({ ...base, loggedByDate: new Map() })[0];
    expect(monday.kind).toBe("planned");
    expect(monday).toMatchObject({ name: "Heavy Lower" });
    expect(monday.kind === "planned" && monday.detail).toMatch(
      /^2 exercises · ~\d+ min$/,
    );
  });

  it("summarizes another planned day by its primary movement signature", () => {
    const tuesday = weekSchedule({ ...base, loggedByDate: new Map() })[1];
    expect(tuesday.kind).toBe("planned");
    // A cardio primary shows just its target; a strength primary would carry
    // its name too.
    expect(tuesday.kind === "planned" && tuesday.detail).toBe("8 × 500 m");
  });

  it("names a strength primary in the signature", () => {
    const week = weekSchedule({
      ...base,
      loggedByDate: new Map(),
      today: "2026-08-11",
    });
    const monday = week[0];
    expect(monday.kind === "planned" && monday.detail).toBe("Back Squat 5×5");
  });

  it("shows a rest day where no session is scheduled", () => {
    const wednesday = weekSchedule({ ...base, loggedByDate: new Map() })[2];
    expect(wednesday.kind).toBe("rest");
  });

  it("reports a logged day by sets and actual minutes", () => {
    const week = weekSchedule({
      ...base,
      loggedByDate: new Map([["2026-08-10", loggedHeavyLower]]),
      today: "2026-08-11",
    });
    const monday = week[0];
    expect(monday.kind).toBe("logged");
    expect(monday).toMatchObject({ name: "Heavy Lower" });
    expect(monday.kind === "logged" && monday.detail).toBe("8 sets · 45 min");
  });

  it("is all rest when no program is placed", () => {
    const week = weekSchedule({
      ...base,
      loggedByDate: new Map(),
      programVersion: undefined,
    });
    expect(week.every((day) => day.kind === "rest")).toBe(true);
  });
});
