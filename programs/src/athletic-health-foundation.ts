import { Prescription } from "@titan/domain/prescription";
import type {
  Program,
  ProgramVersion,
  SessionTemplate,
} from "@titan/domain/program";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import {
  strengthReentryBlock,
  strengthReentrySessionTemplates,
} from "./strength-reentry-block";

/**
 * Program 1 — Athletic Health Foundation. A four-week {@link strengthReentryBlock}
 * on-ramp that restores strength-training tolerance and current working loads,
 * then the eight-week Foundation Block (deload every fourth week) it feeds
 * directly into. The full weekly schedule (Mon Heavy Lower … Sun Recovery) with
 * every exercise slot, its starting prescription, and its progression policy per
 * the spec.
 */
export const athleticHealthFoundation: Program = {
  description:
    "A twelve-week block that opens with a four-week Strength Reentry on-ramp, then eight weeks of foundation training balancing heavy lifting, rowing intervals, Zone 2 aerobic work, and athletic variety for long-term health and body composition.",
  goals: [
    "Long-term health",
    "Weight loss",
    "Preserve and build muscle",
    "Maintain athleticism",
    "Rebuild strength",
  ],
  id: "athletic-health-foundation",
  name: "Athletic Health Foundation",
};

const heavyLower: SessionTemplate = {
  constraints: { preferredDay: 1 },
  focus: "squat",
  id: "foundation-heavy-lower",
  name: "Heavy Lower",
  slots: [
    {
      base: Prescription.Strength({
        reps: 5,
        rpeTarget: 8,
        sets: 5,
        weightLb: 225,
      }),
      exerciseId: "back-squat",
      generateWarmup: true,
      id: "ahf-back-squat",
      progression: ProgressionPolicy.Linear({
        incrementLb: 5,
        missesBeforeDeload: 2,
        reps: 5,
        retainOnDeload: 0.9,
        rpeCap: 8.5,
        sets: 5,
      }),
      role: "primary",
    },
    {
      base: Prescription.Strength({ reps: 8, sets: 3, weightLb: 155 }),
      exerciseId: "romanian-deadlift",
      generateWarmup: true,
      id: "ahf-romanian-deadlift",
      progression: ProgressionPolicy.Double({
        incrementLb: 5,
        maxReps: 10,
        minReps: 8,
        rpeCap: 8,
        sets: 3,
      }),
      role: "secondary",
    },
    {
      base: Prescription.Strength({ reps: 10, sets: 3, weightLb: 35 }),
      exerciseId: "bulgarian-split-squat",
      generateWarmup: false,
      id: "foundation-heavy-lower-bulgarian-split-squat",
      progression: ProgressionPolicy.Double({
        incrementLb: 5,
        maxReps: 12,
        minReps: 10,
        rpeCap: 8,
        sets: 3,
      }),
      role: "accessory",
    },
    {
      base: Prescription.Strength({ reps: 15, sets: 3, weightLb: 90 }),
      exerciseId: "standing-calf-raise",
      generateWarmup: false,
      id: "foundation-heavy-lower-standing-calf-raise",
      progression: ProgressionPolicy.Double({
        incrementLb: 10,
        maxReps: 20,
        minReps: 15,
        rpeCap: 8,
        sets: 3,
      }),
      role: "accessory",
    },
    {
      base: Prescription.TimedHold({ holdSec: 60, sets: 3 }),
      exerciseId: "plank",
      generateWarmup: false,
      id: "ahf-plank",
      progression: ProgressionPolicy.TimedHold({
        addWeightAfterSec: 120,
        holdIncrementSec: 10,
        sets: 3,
        startSec: 60,
      }),
      role: "accessory",
    },
    {
      base: Prescription.TimedCardio({
        durationSec: 600,
        strokeRateMax: 22,
        strokeRateMin: 18,
        targetHrZone: 2,
      }),
      exerciseId: "rower",
      generateWarmup: false,
      id: "foundation-heavy-lower-zone2-finisher",
      note: "Ten-minute Zone 2 row finisher.",
      progression: ProgressionPolicy.None(),
      role: "accessory",
    },
  ],
  tags: ["heavy-lower"],
  targetDurationMin: 60,
};

const rowIntervalProgression = ProgressionPolicy.Interval({
  maxDegradationSecPer500: 2,
  paceImprovementSecPer500: 1,
  rpeCap: 8.5,
});

const rowIntervals: SessionTemplate = {
  constraints: {
    allowedDays: [1, 2, 3, 4],
    avoidPreviousDayTags: ["hard-row", "heavy-lower"],
    preferredDay: 2,
  },
  focus: "cardio",
  id: "foundation-row-intervals",
  name: "Row Intervals",
  tags: ["hard-row"],
  targetDurationMin: 60,
  variants: [
    {
      label: "Week A — 6×500m",
      slots: [
        {
          base: Prescription.Intervals({
            count: 6,
            recoverySec: 120,
            targetSplitSecPer500: 105,
            workDistanceMeters: 500,
          }),
          exerciseId: "rower",
          generateWarmup: false,
          id: "foundation-row-intervals-week-a-rower",
          progression: rowIntervalProgression,
          role: "primary",
        },
      ],
    },
    {
      label: "Week B — 4×1000m",
      slots: [
        {
          base: Prescription.Intervals({
            count: 4,
            recoverySec: 180,
            targetSplitSecPer500: 110,
            workDistanceMeters: 1000,
          }),
          exerciseId: "rower",
          generateWarmup: false,
          id: "foundation-row-intervals-week-b-rower",
          progression: rowIntervalProgression,
          role: "primary",
        },
      ],
    },
    {
      label: "Week C — 8×250m",
      slots: [
        {
          base: Prescription.Intervals({
            count: 8,
            recoverySec: 90,
            targetSplitSecPer500: 102,
            workDistanceMeters: 250,
          }),
          exerciseId: "rower",
          generateWarmup: false,
          id: "foundation-row-intervals-week-c-rower",
          progression: rowIntervalProgression,
          role: "primary",
        },
      ],
    },
    {
      label: "Week D — 12×(30s hard / 90s easy)",
      slots: [
        {
          base: Prescription.Intervals({
            count: 12,
            recoverySec: 90,
            targetSplitSecPer500: 100,
            workSec: 30,
          }),
          exerciseId: "rower",
          generateWarmup: false,
          id: "foundation-row-intervals-week-d-rower",
          progression: rowIntervalProgression,
          role: "primary",
        },
      ],
    },
  ],
};

const heavyUpper: SessionTemplate = {
  constraints: { preferredDay: 3 },
  focus: "horizontal-push",
  id: "foundation-heavy-upper",
  name: "Heavy Upper",
  slots: [
    {
      base: Prescription.Strength({
        reps: 5,
        rpeTarget: 8,
        sets: 5,
        weightLb: 155,
      }),
      exerciseId: "bench-press",
      generateWarmup: true,
      id: "ahf-bench-press",
      progression: ProgressionPolicy.Linear({
        incrementLb: 5,
        missesBeforeDeload: 2,
        reps: 5,
        retainOnDeload: 0.9,
        rpeCap: 8.5,
        sets: 5,
      }),
      role: "primary",
    },
    {
      base: Prescription.Bodyweight({ addedWeightLb: 25, reps: 6, sets: 4 }),
      exerciseId: "weighted-pullup",
      generateWarmup: false,
      id: "foundation-heavy-upper-weighted-pullup",
      progression: ProgressionPolicy.Double({
        incrementLb: 5,
        maxReps: 8,
        minReps: 6,
        rpeCap: 8,
        sets: 4,
      }),
      role: "secondary",
    },
    {
      base: Prescription.Strength({ reps: 8, sets: 3, weightLb: 95 }),
      exerciseId: "overhead-press",
      generateWarmup: true,
      id: "ahf-overhead-press",
      progression: ProgressionPolicy.Double({
        incrementLb: 5,
        maxReps: 10,
        minReps: 8,
        rpeCap: 8,
        sets: 3,
      }),
      role: "secondary",
    },
    {
      base: Prescription.Strength({ reps: 8, sets: 3, weightLb: 135 }),
      exerciseId: "barbell-row",
      generateWarmup: true,
      id: "ahf-barbell-row",
      progression: ProgressionPolicy.Double({
        incrementLb: 5,
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
      id: "foundation-heavy-upper-dips",
      progression: ProgressionPolicy.Double({
        incrementLb: 5,
        maxReps: 15,
        minReps: 10,
        rpeCap: 8,
        sets: 3,
      }),
      role: "accessory",
    },
    {
      base: Prescription.Bodyweight({ reps: 10, sets: 3 }),
      exerciseId: "ab-wheel",
      generateWarmup: false,
      id: "ahf-ab-wheel",
      progression: ProgressionPolicy.Amrap({ repCap: 15, sets: 3 }),
      role: "accessory",
    },
  ],
  tags: ["heavy-upper"],
  targetDurationMin: 60,
};

const zone2Row: SessionTemplate = {
  constraints: { preferredDay: 4 },
  focus: "cardio",
  id: "foundation-zone2-row",
  name: "Zone 2 Row",
  slots: [
    {
      base: Prescription.TimedCardio({
        durationSec: 2700,
        strokeRateMax: 22,
        strokeRateMin: 18,
        targetHrZone: 2,
      }),
      exerciseId: "rower",
      generateWarmup: false,
      id: "foundation-zone2-row-rower",
      progression: ProgressionPolicy.Zone2({
        durationIncrementSec: 300,
        maxDurationSec: 3600,
        startDurationSec: 2700,
      }),
      role: "primary",
    },
  ],
  tags: ["zone2"],
  targetDurationMin: 60,
};

const athleticDay: SessionTemplate = {
  constraints: { preferredDay: 5 },
  focus: "conditioning",
  id: "foundation-athletic-day",
  name: "Athletic Day",
  tags: ["athletic"],
  targetDurationMin: 60,
  variants: [
    {
      label: "Workout A — Power",
      slots: [
        {
          base: Prescription.Strength({ reps: 5, sets: 3, weightLb: 275 }),
          exerciseId: "deadlift",
          generateWarmup: true,
          id: "ahf-deadlift",
          progression: ProgressionPolicy.Linear({
            incrementLb: 10,
            missesBeforeDeload: 2,
            reps: 5,
            retainOnDeload: 0.9,
            rpeCap: 8.5,
            sets: 3,
          }),
          role: "primary",
        },
        {
          base: Prescription.Strength({ reps: 3, sets: 5, weightLb: 115 }),
          exerciseId: "push-press",
          generateWarmup: true,
          id: "foundation-athletic-day-power-push-press",
          progression: ProgressionPolicy.Linear({
            incrementLb: 5,
            missesBeforeDeload: 2,
            reps: 3,
            retainOnDeload: 0.9,
            rpeCap: 8.5,
            sets: 5,
          }),
          role: "secondary",
        },
        {
          base: Prescription.Strength({ reps: 1, sets: 4, weightLb: 150 }),
          exerciseId: "farmer-carry",
          generateWarmup: false,
          id: "foundation-athletic-day-power-farmer-carry",
          note: "Four carries of roughly 40m each.",
          progression: ProgressionPolicy.Linear({
            incrementLb: 10,
            missesBeforeDeload: 2,
            reps: 1,
            retainOnDeload: 0.9,
            rpeCap: 8.5,
            sets: 4,
          }),
          role: "accessory",
        },
        {
          base: Prescription.Bodyweight({
            addedWeightLb: 25,
            reps: 6,
            sets: 3,
          }),
          exerciseId: "weighted-pullup",
          generateWarmup: false,
          id: "foundation-athletic-day-power-weighted-pullup",
          progression: ProgressionPolicy.Double({
            incrementLb: 5,
            maxReps: 8,
            minReps: 6,
            rpeCap: 8,
            sets: 3,
          }),
          role: "accessory",
        },
      ],
    },
    {
      label: "Workout B — Conditioning",
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
          id: "foundation-athletic-day-conditioning-circuit",
          note: "Progress by reducing rest first, then adding rounds.",
          progression: ProgressionPolicy.None(),
          role: "primary",
        },
      ],
    },
    {
      label: "Workout C — Hill Sprint",
      slots: [
        {
          base: Prescription.Intervals({
            count: 8,
            recoverySec: 60,
            workSec: 20,
          }),
          exerciseId: "hill-sprint",
          generateWarmup: false,
          id: "foundation-athletic-day-hill-sprint-hill-sprint",
          note: "Ten-minute warmup, then walk-down recovery between sprints.",
          progression: ProgressionPolicy.None(),
          role: "primary",
        },
        {
          base: Prescription.Bodyweight({ reps: 20, sets: 3 }),
          exerciseId: "pushup",
          generateWarmup: false,
          id: "foundation-athletic-day-hill-sprint-pushup",
          progression: ProgressionPolicy.Double({
            incrementLb: 5,
            maxReps: 30,
            minReps: 20,
            rpeCap: 8,
            sets: 3,
          }),
          role: "accessory",
        },
        {
          base: Prescription.Bodyweight({ reps: 20, sets: 3 }),
          exerciseId: "walking-lunge",
          generateWarmup: false,
          id: "foundation-athletic-day-hill-sprint-walking-lunge",
          progression: ProgressionPolicy.Double({
            incrementLb: 5,
            maxReps: 30,
            minReps: 20,
            rpeCap: 8,
            sets: 3,
          }),
          role: "accessory",
        },
        {
          base: Prescription.TimedHold({ holdSec: 45, sets: 3 }),
          exerciseId: "side-plank",
          generateWarmup: false,
          id: "foundation-athletic-day-hill-sprint-side-plank",
          progression: ProgressionPolicy.TimedHold({
            addWeightAfterSec: 90,
            holdIncrementSec: 10,
            sets: 3,
            startSec: 45,
          }),
          role: "accessory",
        },
      ],
    },
  ],
};

const longEasyCardio: SessionTemplate = {
  constraints: { preferredDay: 6 },
  focus: "cardio",
  id: "foundation-long-easy-cardio",
  name: "Long Easy Cardio",
  tags: ["easy-cardio"],
  targetDurationMin: 75,
  variants: [
    {
      label: "Week 1 — 75-minute row",
      slots: [
        {
          base: Prescription.TimedCardio({
            durationSec: 4500,
            targetHrZone: 2,
          }),
          exerciseId: "rower",
          generateWarmup: false,
          id: "foundation-long-easy-cardio-row",
          progression: ProgressionPolicy.None(),
          role: "primary",
        },
      ],
    },
    {
      label: "Week 2 — trail run",
      slots: [
        {
          base: Prescription.TimedCardio({
            durationSec: 3600,
            targetHrZone: 2,
          }),
          exerciseId: "run",
          generateWarmup: false,
          id: "foundation-long-easy-cardio-trail-run",
          progression: ProgressionPolicy.None(),
          role: "primary",
        },
      ],
    },
    {
      label: "Week 3 — mountain hike",
      slots: [
        {
          base: Prescription.TimedCardio({
            durationSec: 5400,
            targetHrZone: 2,
          }),
          exerciseId: "hike",
          generateWarmup: false,
          id: "foundation-long-easy-cardio-hike",
          progression: ProgressionPolicy.None(),
          role: "primary",
        },
      ],
    },
    {
      label: "Week 4 — bike ride",
      slots: [
        {
          base: Prescription.TimedCardio({
            durationSec: 4500,
            targetHrZone: 2,
          }),
          exerciseId: "bike",
          generateWarmup: false,
          id: "foundation-long-easy-cardio-bike",
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
  id: "foundation-recovery",
  name: "Recovery",
  slots: [
    {
      base: Prescription.TimedCardio({ durationSec: 1200, targetHrZone: 1 }),
      exerciseId: "rower",
      generateWarmup: false,
      id: "foundation-recovery-easy-row",
      note: "Any easy movement — walk, mobility, or a sub-20-minute easy row.",
      progression: ProgressionPolicy.None(),
      role: "accessory",
    },
  ],
  tags: ["recovery"],
  targetDurationMin: 30,
};

const sessionTemplates: readonly SessionTemplate[] = [
  heavyLower,
  rowIntervals,
  heavyUpper,
  zone2Row,
  athleticDay,
  longEasyCardio,
  recovery,
];

export const athleticHealthFoundationV1: ProgramVersion = {
  blocks: [
    strengthReentryBlock,
    {
      deloadEveryWeeks: 4,
      durationWeeks: 8,
      id: "athletic-health-foundation-block",
      name: "Foundation Block",
      weekTemplate: {
        days: [
          { dayOfWeek: 1, sessionTemplateId: "foundation-heavy-lower" },
          { dayOfWeek: 2, sessionTemplateId: "foundation-row-intervals" },
          { dayOfWeek: 3, sessionTemplateId: "foundation-heavy-upper" },
          { dayOfWeek: 4, sessionTemplateId: "foundation-zone2-row" },
          { dayOfWeek: 5, sessionTemplateId: "foundation-athletic-day" },
          { dayOfWeek: 6, sessionTemplateId: "foundation-long-easy-cardio" },
          { dayOfWeek: 7, sessionTemplateId: "foundation-recovery" },
        ],
      },
    },
  ],
  createdAt: "2026-01-01T00:00:00.000Z",
  id: "athletic-health-foundation-v1",
  programId: "athletic-health-foundation",
  sessionTemplates: [...sessionTemplates, ...strengthReentrySessionTemplates],
  version: 1,
};
