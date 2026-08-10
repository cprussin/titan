import { Prescription } from "@titan/domain/prescription";
import type {
  Program,
  ProgramVersion,
  SessionTemplate,
} from "@titan/domain/program";
import { ProgressionPolicy } from "@titan/domain/progression-policy";

/**
 * Program 4 — Fat Loss Maintenance. An open-ended, sustainable block balancing
 * strength and cardio with moderate progression; modeled as an eight-week block
 * that repeats indefinitely.
 */
export const fatLossMaintenance: Program = {
  description:
    "A sustainable, open-ended block balancing full-body strength, intervals, and aerobic work with moderate progression and readiness-based volume, built for consistency over peak performance.",
  goals: [
    "Sustainable fat loss",
    "Maintain strength and muscle",
    "Balanced conditioning",
    "Long-term consistency",
  ],
  id: "fat-loss-maintenance",
  name: "Fat Loss Maintenance",
};

const fullBodyStrength: SessionTemplate = {
  constraints: { preferredDay: 1 },
  focus: "squat",
  id: "fatloss-full-body-strength",
  name: "Full Body Strength",
  slots: [
    {
      base: Prescription.Strength({ reps: 8, sets: 3, unit: "kg", weight: 85 }),
      exerciseId: "back-squat",
      generateWarmup: true,
      id: "fatloss-full-body-strength-back-squat",
      progression: ProgressionPolicy.Double({
        increment: 2.5,
        maxReps: 10,
        minReps: 8,
        rpeCap: 8,
        sets: 3,
      }),
      role: "primary",
    },
    {
      base: Prescription.Strength({ reps: 8, sets: 3, unit: "kg", weight: 60 }),
      exerciseId: "bench-press",
      generateWarmup: true,
      id: "fatloss-full-body-strength-bench-press",
      progression: ProgressionPolicy.Double({
        increment: 2.5,
        maxReps: 10,
        minReps: 8,
        rpeCap: 8,
        sets: 3,
      }),
      role: "secondary",
    },
    {
      base: Prescription.Strength({
        reps: 8,
        sets: 3,
        unit: "kg",
        weight: 52.5,
      }),
      exerciseId: "barbell-row",
      generateWarmup: true,
      id: "fatloss-full-body-strength-barbell-row",
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
  tags: ["full-body"],
  targetDurationMin: 50,
};

const intervals: SessionTemplate = {
  constraints: {
    allowedDays: [1, 2, 3, 4],
    avoidPreviousDayTags: ["hard-row", "full-body"],
    preferredDay: 2,
  },
  focus: "cardio",
  id: "fatloss-intervals",
  name: "Intervals",
  slots: [
    {
      base: Prescription.Intervals({
        count: 8,
        recoverySec: 90,
        targetSplitSecPer500: 105,
        workDistanceMeters: 250,
      }),
      exerciseId: "rower",
      generateWarmup: false,
      id: "fatloss-intervals-rower",
      progression: ProgressionPolicy.Interval({
        maxDegradationSecPer500: 2,
        paceImprovementSecPer500: 1,
        rpeCap: 8.5,
      }),
      role: "primary",
    },
  ],
  tags: ["hard-row"],
  targetDurationMin: 40,
};

const zone2: SessionTemplate = {
  constraints: { preferredDay: 3 },
  focus: "cardio",
  id: "fatloss-zone2",
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
      id: "fatloss-zone2-rower",
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

const upperStrength: SessionTemplate = {
  constraints: { preferredDay: 4 },
  focus: "vertical-push",
  id: "fatloss-upper-strength",
  name: "Upper Strength",
  slots: [
    {
      base: Prescription.Strength({
        reps: 8,
        sets: 3,
        unit: "kg",
        weight: 37.5,
      }),
      exerciseId: "overhead-press",
      generateWarmup: true,
      id: "fatloss-upper-strength-overhead-press",
      progression: ProgressionPolicy.Double({
        increment: 2.5,
        maxReps: 10,
        minReps: 8,
        rpeCap: 8,
        sets: 3,
      }),
      role: "primary",
    },
    {
      base: Prescription.Bodyweight({ reps: 8, sets: 3 }),
      exerciseId: "weighted-pullup",
      generateWarmup: false,
      id: "fatloss-upper-strength-weighted-pullup",
      progression: ProgressionPolicy.Double({
        increment: 5,
        maxReps: 10,
        minReps: 8,
        rpeCap: 8,
        sets: 3,
      }),
      role: "secondary",
    },
    {
      base: Prescription.Bodyweight({ reps: 10, sets: 3 }),
      exerciseId: "dips",
      generateWarmup: false,
      id: "fatloss-upper-strength-dips",
      progression: ProgressionPolicy.Double({
        increment: 5,
        maxReps: 15,
        minReps: 10,
        rpeCap: 8,
        sets: 3,
      }),
      role: "accessory",
    },
  ],
  tags: ["heavy-upper"],
  targetDurationMin: 45,
};

const conditioning: SessionTemplate = {
  constraints: { preferredDay: 5 },
  focus: "conditioning",
  id: "fatloss-conditioning",
  name: "Conditioning",
  slots: [
    {
      base: Prescription.Circuit({
        restSec: 90,
        rounds: 5,
        stations: [
          { distanceMeters: 250, exerciseId: "rower" },
          { exerciseId: "burpee", reps: 10 },
          { exerciseId: "dumbbell-swing", reps: 15 },
        ],
      }),
      exerciseId: "burpee",
      generateWarmup: false,
      id: "fatloss-conditioning-circuit",
      note: "Progress by reducing rest first, then adding rounds.",
      progression: ProgressionPolicy.None(),
      role: "primary",
    },
  ],
  tags: ["conditioning"],
  targetDurationMin: 40,
};

const longEasyCardio: SessionTemplate = {
  constraints: { preferredDay: 6 },
  focus: "cardio",
  id: "fatloss-long-easy-cardio",
  name: "Long Easy Cardio",
  tags: ["easy-cardio"],
  targetDurationMin: 60,
  variants: [
    {
      label: "Easy row",
      slots: [
        {
          base: Prescription.TimedCardio({
            durationSec: 3600,
            targetHrZone: 2,
          }),
          exerciseId: "rower",
          generateWarmup: false,
          id: "fatloss-long-easy-cardio-row",
          progression: ProgressionPolicy.None(),
          role: "primary",
        },
      ],
    },
    {
      label: "Trail run or recreation",
      slots: [
        {
          base: Prescription.TimedCardio({
            durationSec: 3600,
            targetHrZone: 2,
          }),
          exerciseId: "run",
          generateWarmup: false,
          id: "fatloss-long-easy-cardio-run",
          progression: ProgressionPolicy.None(),
          role: "primary",
        },
      ],
    },
    {
      label: "Bike ride",
      slots: [
        {
          base: Prescription.TimedCardio({
            durationSec: 4500,
            targetHrZone: 2,
          }),
          exerciseId: "bike",
          generateWarmup: false,
          id: "fatloss-long-easy-cardio-bike",
          progression: ProgressionPolicy.None(),
          role: "primary",
        },
      ],
    },
  ],
};

const recovery: SessionTemplate = {
  constraints: { preferredDay: 7 },
  focus: "cardio",
  id: "fatloss-recovery",
  name: "Recovery",
  slots: [
    {
      base: Prescription.TimedCardio({ durationSec: 1200, targetHrZone: 1 }),
      exerciseId: "rower",
      generateWarmup: false,
      id: "fatloss-recovery-easy-row",
      progression: ProgressionPolicy.None(),
      role: "accessory",
    },
  ],
  tags: ["recovery"],
  targetDurationMin: 30,
};

export const fatLossMaintenanceV1: ProgramVersion = {
  blocks: [
    {
      deloadEveryWeeks: 4,
      durationWeeks: 8,
      id: "fat-loss-maintenance-block",
      name: "Maintenance Block",
      weekTemplate: {
        days: [
          { dayOfWeek: 1, sessionTemplateId: "fatloss-full-body-strength" },
          { dayOfWeek: 2, sessionTemplateId: "fatloss-intervals" },
          { dayOfWeek: 3, sessionTemplateId: "fatloss-zone2" },
          { dayOfWeek: 4, sessionTemplateId: "fatloss-upper-strength" },
          { dayOfWeek: 5, sessionTemplateId: "fatloss-conditioning" },
          { dayOfWeek: 6, sessionTemplateId: "fatloss-long-easy-cardio" },
          { dayOfWeek: 7, sessionTemplateId: "fatloss-recovery" },
        ],
      },
    },
  ],
  createdAt: "2026-01-01T00:00:00.000Z",
  id: "fat-loss-maintenance-v1",
  programId: "fat-loss-maintenance",
  sessionTemplates: [
    fullBodyStrength,
    intervals,
    zone2,
    upperStrength,
    conditioning,
    longEasyCardio,
    recovery,
  ],
  version: 1,
};
