import { Prescription } from "@titan/domain/prescription";
import type {
  Program,
  ProgramVersion,
  SessionTemplate,
} from "@titan/domain/program";
import { ProgressionPolicy } from "@titan/domain/progression-policy";

/**
 * Program 3 — Strength & Power. Six weeks of heavy compound lifting and
 * explosive work with reduced rowing volume.
 */
export const strengthPower: Program = {
  description:
    "A six-week strength and power block built on heavy compound lifts, low-rep primary prescriptions, hill sprints, and explosive work, with minimal rowing volume.",
  goals: [
    "Build maximal strength",
    "Develop power and explosiveness",
    "Preserve athleticism",
    "Maintain aerobic base",
  ],
  id: "strength-power",
  name: "Strength & Power",
};

const heavyLower: SessionTemplate = {
  constraints: { preferredDay: 1 },
  focus: "squat",
  id: "power-heavy-lower",
  name: "Heavy Lower",
  slots: [
    {
      base: Prescription.Strength({
        reps: 3,
        rpeTarget: 8,
        sets: 5,
        unit: "kg",
        weight: 130,
      }),
      exerciseId: "back-squat",
      generateWarmup: true,
      id: "power-heavy-lower-back-squat",
      progression: ProgressionPolicy.Linear({
        increment: 5,
        missesBeforeDeload: 2,
        reps: 3,
        retainOnDeload: 0.9,
        rpeCap: 8.5,
        sets: 5,
      }),
      role: "primary",
    },
    {
      base: Prescription.Strength({
        reps: 5,
        sets: 3,
        unit: "kg",
        weight: 92.5,
      }),
      exerciseId: "romanian-deadlift",
      generateWarmup: true,
      id: "power-heavy-lower-romanian-deadlift",
      progression: ProgressionPolicy.Double({
        increment: 5,
        maxReps: 8,
        minReps: 5,
        rpeCap: 8,
        sets: 3,
      }),
      role: "secondary",
    },
  ],
  tags: ["heavy-lower"],
  targetDurationMin: 60,
};

const upperPush: SessionTemplate = {
  constraints: { preferredDay: 2 },
  focus: "horizontal-push",
  id: "power-upper-push",
  name: "Upper Push",
  slots: [
    {
      base: Prescription.Strength({
        reps: 3,
        rpeTarget: 8,
        sets: 5,
        unit: "kg",
        weight: 87.5,
      }),
      exerciseId: "bench-press",
      generateWarmup: true,
      id: "power-upper-push-bench-press",
      progression: ProgressionPolicy.Linear({
        increment: 2.5,
        missesBeforeDeload: 2,
        reps: 3,
        retainOnDeload: 0.9,
        rpeCap: 8.5,
        sets: 5,
      }),
      role: "primary",
    },
    {
      base: Prescription.Strength({
        reps: 3,
        sets: 5,
        unit: "kg",
        weight: 52.5,
      }),
      exerciseId: "overhead-press",
      generateWarmup: true,
      id: "power-upper-push-overhead-press",
      progression: ProgressionPolicy.Linear({
        increment: 2.5,
        missesBeforeDeload: 2,
        reps: 3,
        retainOnDeload: 0.9,
        rpeCap: 8.5,
        sets: 5,
      }),
      role: "secondary",
    },
  ],
  tags: ["heavy-upper"],
  targetDurationMin: 55,
};

const hillSprints: SessionTemplate = {
  constraints: { preferredDay: 3 },
  focus: "conditioning",
  id: "power-hill-sprints",
  name: "Hill Sprints",
  slots: [
    {
      base: Prescription.Intervals({ count: 10, recoverySec: 60, workSec: 20 }),
      exerciseId: "hill-sprint",
      generateWarmup: false,
      id: "power-hill-sprints-hill-sprint",
      note: "Ten-minute warmup, then walk-down recovery between sprints.",
      progression: ProgressionPolicy.None(),
      role: "primary",
    },
  ],
  tags: ["conditioning"],
  targetDurationMin: 45,
};

const heavyPull: SessionTemplate = {
  constraints: { preferredDay: 4 },
  focus: "hinge",
  id: "power-heavy-pull",
  name: "Heavy Pull",
  slots: [
    {
      base: Prescription.Strength({
        reps: 3,
        rpeTarget: 8,
        sets: 3,
        unit: "kg",
        weight: 142.5,
      }),
      exerciseId: "deadlift",
      generateWarmup: true,
      id: "power-heavy-pull-deadlift",
      progression: ProgressionPolicy.Linear({
        increment: 5,
        missesBeforeDeload: 2,
        reps: 3,
        retainOnDeload: 0.9,
        rpeCap: 8.5,
        sets: 3,
      }),
      role: "primary",
    },
    {
      base: Prescription.Bodyweight({ addedWeightLb: 45, reps: 6, sets: 4 }),
      exerciseId: "weighted-pullup",
      generateWarmup: false,
      id: "power-heavy-pull-weighted-pullup",
      progression: ProgressionPolicy.Double({
        increment: 5,
        maxReps: 8,
        minReps: 6,
        rpeCap: 8,
        sets: 4,
      }),
      role: "secondary",
    },
    {
      base: Prescription.Strength({ reps: 5, sets: 3, unit: "kg", weight: 70 }),
      exerciseId: "barbell-row",
      generateWarmup: true,
      id: "power-heavy-pull-barbell-row",
      progression: ProgressionPolicy.Double({
        increment: 2.5,
        maxReps: 8,
        minReps: 5,
        rpeCap: 8,
        sets: 3,
      }),
      role: "accessory",
    },
  ],
  tags: ["heavy-pull"],
  targetDurationMin: 60,
};

const power: SessionTemplate = {
  constraints: { preferredDay: 5 },
  focus: "vertical-push",
  id: "power-day",
  name: "Power",
  slots: [
    {
      base: Prescription.Strength({
        reps: 3,
        rpeTarget: 8,
        sets: 5,
        unit: "kg",
        weight: 60,
      }),
      exerciseId: "push-press",
      generateWarmup: true,
      id: "power-day-push-press",
      progression: ProgressionPolicy.Linear({
        increment: 2.5,
        missesBeforeDeload: 2,
        reps: 3,
        retainOnDeload: 0.9,
        rpeCap: 8.5,
        sets: 5,
      }),
      role: "primary",
    },
    {
      base: Prescription.Strength({ reps: 1, sets: 4, weight: 185 }),
      exerciseId: "farmer-carry",
      generateWarmup: false,
      id: "power-day-farmer-carry",
      note: "Four heavy carries of roughly 40m each.",
      progression: ProgressionPolicy.Linear({
        increment: 10,
        missesBeforeDeload: 2,
        reps: 1,
        retainOnDeload: 0.9,
        rpeCap: 8.5,
        sets: 4,
      }),
      role: "secondary",
    },
  ],
  tags: ["power"],
  targetDurationMin: 45,
};

const zone2: SessionTemplate = {
  constraints: { preferredDay: 6 },
  focus: "cardio",
  id: "power-zone2",
  name: "Zone 2",
  slots: [
    {
      base: Prescription.TimedCardio({
        durationSec: 2400,
        strokeRateMax: 22,
        strokeRateMin: 18,
        targetHrZone: 2,
      }),
      exerciseId: "rower",
      generateWarmup: false,
      id: "power-zone2-rower",
      progression: ProgressionPolicy.Zone2({
        durationIncrementSec: 300,
        maxDurationSec: 3600,
        startDurationSec: 2400,
      }),
      role: "primary",
    },
  ],
  tags: ["zone2"],
  targetDurationMin: 45,
};

const recovery: SessionTemplate = {
  constraints: { preferredDay: 7 },
  focus: "cardio",
  id: "power-recovery",
  name: "Recovery",
  slots: [
    {
      base: Prescription.TimedCardio({ durationSec: 1200, targetHrZone: 1 }),
      exerciseId: "rower",
      generateWarmup: false,
      id: "power-recovery-easy-row",
      progression: ProgressionPolicy.None(),
      role: "accessory",
    },
  ],
  tags: ["recovery"],
  targetDurationMin: 30,
};

export const strengthPowerV1: ProgramVersion = {
  blocks: [
    {
      deloadEveryWeeks: 3,
      durationWeeks: 6,
      id: "strength-power-block",
      name: "Strength & Power Block",
      weekTemplate: {
        days: [
          { dayOfWeek: 1, sessionTemplateId: "power-heavy-lower" },
          { dayOfWeek: 2, sessionTemplateId: "power-upper-push" },
          { dayOfWeek: 3, sessionTemplateId: "power-hill-sprints" },
          { dayOfWeek: 4, sessionTemplateId: "power-heavy-pull" },
          { dayOfWeek: 5, sessionTemplateId: "power-day" },
          { dayOfWeek: 6, sessionTemplateId: "power-zone2" },
          { dayOfWeek: 7, sessionTemplateId: "power-recovery" },
        ],
      },
    },
  ],
  createdAt: "2026-01-01T00:00:00.000Z",
  id: "strength-power-v1",
  programId: "strength-power",
  sessionTemplates: [
    heavyLower,
    upperPush,
    hillSprints,
    heavyPull,
    power,
    zone2,
    recovery,
  ],
  version: 1,
};
