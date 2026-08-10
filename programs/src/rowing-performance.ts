import { Prescription } from "@titan/domain/prescription";
import type {
  Program,
  ProgramVersion,
  SessionTemplate,
} from "@titan/domain/program";
import { ProgressionPolicy } from "@titan/domain/progression-policy";

/**
 * Program 2 — Rowing Performance. Eight weeks aimed at 2k/5k/10k and rowing
 * economy, with strength maintained at roughly 50–60% of Foundation volume.
 */
export const rowingPerformance: Program = {
  description:
    "An eight-week rowing block targeting 2k, 5k, and 10k performance with VO₂, threshold, and long aerobic rows, while maintaining strength at a reduced volume.",
  goals: [
    "Improve 2k",
    "Improve 5k",
    "Improve 10k",
    "Improve rowing economy",
    "Maintain strength",
  ],
  id: "rowing-performance",
  name: "Rowing Performance",
};

const heavyLower: SessionTemplate = {
  constraints: { preferredDay: 1 },
  focus: "squat",
  id: "rowing-heavy-lower",
  name: "Heavy Lower",
  slots: [
    {
      base: Prescription.Strength({
        reps: 5,
        rpeTarget: 8,
        sets: 5,
        unit: "kg",
        weight: 102.5,
      }),
      exerciseId: "back-squat",
      generateWarmup: true,
      id: "rowing-heavy-lower-back-squat",
      progression: ProgressionPolicy.Linear({
        increment: 2.5,
        missesBeforeDeload: 2,
        reps: 5,
        retainOnDeload: 0.9,
        rpeCap: 8.5,
        sets: 5,
      }),
      role: "primary",
    },
    {
      base: Prescription.Strength({ reps: 8, sets: 3, unit: "kg", weight: 70 }),
      exerciseId: "romanian-deadlift",
      generateWarmup: true,
      id: "rowing-heavy-lower-romanian-deadlift",
      progression: ProgressionPolicy.Double({
        increment: 2.5,
        maxReps: 10,
        minReps: 8,
        rpeCap: 8,
        sets: 3,
      }),
      role: "secondary",
    },
  ],
  tags: ["heavy-lower"],
  targetDurationMin: 50,
};

const vo2MaxIntervals: SessionTemplate = {
  constraints: {
    allowedDays: [1, 2, 3, 4],
    avoidPreviousDayTags: ["hard-row", "heavy-lower"],
    preferredDay: 2,
  },
  focus: "cardio",
  id: "rowing-vo2-max-intervals",
  name: "VO₂ Max Intervals",
  slots: [
    {
      base: Prescription.Intervals({
        count: 6,
        recoverySec: 120,
        targetSplitSecPer500: 100,
        workDistanceMeters: 500,
      }),
      exerciseId: "rower",
      generateWarmup: false,
      id: "rowing-vo2-max-intervals-rower",
      progression: ProgressionPolicy.Interval({
        maxDegradationSecPer500: 2,
        paceImprovementSecPer500: 1,
        rpeCap: 8.5,
      }),
      role: "primary",
    },
  ],
  tags: ["hard-row"],
  targetDurationMin: 50,
};

const upperStrength: SessionTemplate = {
  constraints: { preferredDay: 3 },
  focus: "horizontal-push",
  id: "rowing-upper-strength",
  name: "Upper Strength",
  slots: [
    {
      base: Prescription.Strength({
        reps: 5,
        rpeTarget: 8,
        sets: 5,
        unit: "kg",
        weight: 70,
      }),
      exerciseId: "bench-press",
      generateWarmup: true,
      id: "rowing-upper-strength-bench-press",
      progression: ProgressionPolicy.Linear({
        increment: 2.5,
        missesBeforeDeload: 2,
        reps: 5,
        retainOnDeload: 0.9,
        rpeCap: 8.5,
        sets: 5,
      }),
      role: "primary",
    },
    {
      base: Prescription.Strength({ reps: 8, sets: 3, unit: "kg", weight: 60 }),
      exerciseId: "barbell-row",
      generateWarmup: true,
      id: "rowing-upper-strength-barbell-row",
      progression: ProgressionPolicy.Double({
        increment: 2.5,
        maxReps: 10,
        minReps: 8,
        rpeCap: 8,
        sets: 3,
      }),
      role: "secondary",
    },
  ],
  tags: ["heavy-upper"],
  targetDurationMin: 45,
};

const thresholdRow: SessionTemplate = {
  constraints: { allowedDays: [3, 4, 5], preferredDay: 4 },
  focus: "cardio",
  id: "rowing-threshold-row",
  name: "Threshold Row",
  slots: [
    {
      base: Prescription.Intervals({
        count: 4,
        recoverySec: 60,
        targetSplitSecPer500: 108,
        workDistanceMeters: 1500,
      }),
      exerciseId: "rower",
      generateWarmup: false,
      id: "rowing-threshold-row-rower",
      progression: ProgressionPolicy.Interval({
        maxDegradationSecPer500: 2,
        paceImprovementSecPer500: 1,
        rpeCap: 8,
      }),
      role: "primary",
    },
  ],
  tags: ["hard-row"],
  targetDurationMin: 55,
};

const recoveryRow: SessionTemplate = {
  constraints: { preferredDay: 5 },
  focus: "cardio",
  id: "rowing-recovery-row",
  name: "Recovery Row",
  slots: [
    {
      base: Prescription.TimedCardio({
        durationSec: 1800,
        strokeRateMax: 20,
        strokeRateMin: 18,
        targetHrZone: 1,
      }),
      exerciseId: "rower",
      generateWarmup: false,
      id: "rowing-recovery-row-rower",
      progression: ProgressionPolicy.None(),
      role: "primary",
    },
  ],
  tags: ["easy-cardio"],
  targetDurationMin: 30,
};

const longRow: SessionTemplate = {
  constraints: { preferredDay: 6 },
  focus: "cardio",
  id: "rowing-long-row",
  name: "Long Row",
  slots: [
    {
      base: Prescription.TimedCardio({
        durationSec: 4800,
        strokeRateMax: 22,
        strokeRateMin: 18,
        targetHrZone: 2,
      }),
      exerciseId: "rower",
      generateWarmup: false,
      id: "rowing-long-row-rower",
      progression: ProgressionPolicy.Zone2({
        durationIncrementSec: 300,
        maxDurationSec: 5400,
        startDurationSec: 4800,
      }),
      role: "primary",
    },
  ],
  tags: ["easy-cardio"],
  targetDurationMin: 80,
};

const recovery: SessionTemplate = {
  constraints: { preferredDay: 7 },
  focus: "cardio",
  id: "rowing-recovery",
  name: "Recovery",
  slots: [
    {
      base: Prescription.TimedCardio({ durationSec: 1200, targetHrZone: 1 }),
      exerciseId: "rower",
      generateWarmup: false,
      id: "rowing-recovery-easy-row",
      progression: ProgressionPolicy.None(),
      role: "accessory",
    },
  ],
  tags: ["recovery"],
  targetDurationMin: 30,
};

export const rowingPerformanceV1: ProgramVersion = {
  blocks: [
    {
      deloadEveryWeeks: 4,
      durationWeeks: 8,
      id: "rowing-performance-block",
      name: "Rowing Block",
      weekTemplate: {
        days: [
          { dayOfWeek: 1, sessionTemplateId: "rowing-heavy-lower" },
          { dayOfWeek: 2, sessionTemplateId: "rowing-vo2-max-intervals" },
          { dayOfWeek: 3, sessionTemplateId: "rowing-upper-strength" },
          { dayOfWeek: 4, sessionTemplateId: "rowing-threshold-row" },
          { dayOfWeek: 5, sessionTemplateId: "rowing-recovery-row" },
          { dayOfWeek: 6, sessionTemplateId: "rowing-long-row" },
          { dayOfWeek: 7, sessionTemplateId: "rowing-recovery" },
        ],
      },
    },
  ],
  createdAt: "2026-01-01T00:00:00.000Z",
  id: "rowing-performance-v1",
  programId: "rowing-performance",
  sessionTemplates: [
    heavyLower,
    vo2MaxIntervals,
    upperStrength,
    thresholdRow,
    recoveryRow,
    longRow,
    recovery,
  ],
  version: 1,
};
