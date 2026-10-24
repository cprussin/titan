import { Prescription } from "@titan/domain/prescription";
import type {
  Program,
  ProgramVersion,
  SessionTemplate,
} from "@titan/domain/program";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import {
  heavyLower,
  heavyUpper,
  isolationSlot,
  longEasyCardio,
  recoveryEasyMovement,
  rowIntervals,
  zone2Row,
} from "./athletic-health-foundation";

/**
 * Program 5 — Athletic Hypertrophy. An eight-week evolution of the Foundation
 * Block that keeps its aerobic work and moves its sessions to new days, trading
 * Friday's rotating Athletic Day for a fixed upper-body hypertrophy session.
 *
 * It is its own program rather than a block after Foundation so the athlete
 * only reaches it by selecting it. The moved sessions spread the Foundation
 * ones, so their slots (and slot ids — history is keyed by slot id, across
 * programs) carry over untouched: switching in picks up Foundation's loads and
 * paces rather than restarting them.
 */
export const athleticHypertrophy: Program = {
  description:
    "An eight-week evolution of the Foundation Block: the same heavy lifting, rowing intervals, and Zone 2 aerobic volume, redistributed across the week, with Friday's athletic day traded for upper-body hypertrophy.",
  goals: ["Long-term health", "Build muscle", "Maintain athleticism"],
  id: "athletic-hypertrophy",
  name: "Athletic Hypertrophy",
};

const hypertrophyHeavyUpper: SessionTemplate = {
  ...heavyUpper,
  constraints: { preferredDay: 1 },
  id: "athletic-hypertrophy-heavy-upper",
  name: "Heavy Upper + Arms",
};

const hypertrophyLongEasyCardio: SessionTemplate = {
  ...longEasyCardio,
  constraints: { preferredDay: 2 },
  id: "athletic-hypertrophy-long-easy-cardio",
};

const hypertrophyHeavyLower: SessionTemplate = {
  ...heavyLower,
  constraints: { preferredDay: 3 },
  id: "athletic-hypertrophy-heavy-lower",
};

/** Execution guidance for Friday's two compounds: longer rest than the
 *  isolation work, so the sets are driven by the target muscle rather than by
 *  accumulated fatigue. */
const hypertrophyCompoundNote =
  "Rest 2–3 min between sets. Leave 1–3 reps in reserve, with controlled reps through a full range of motion.";

const upperHypertrophy: SessionTemplate = {
  constraints: { preferredDay: 5 },
  focus: "horizontal-push",
  id: "athletic-hypertrophy-upper",
  name: "Upper Hypertrophy + Arms",
  slots: [
    {
      base: Prescription.Strength({
        reps: 8,
        rpeTarget: 8,
        sets: 4,
        unit: "kg",
        weight: 50,
      }),
      exerciseId: "incline-bench-press",
      generateWarmup: true,
      id: "athletic-hypertrophy-upper-incline-bench-press",
      note: hypertrophyCompoundNote,
      progression: ProgressionPolicy.Double({
        increment: 2,
        maxReps: 10,
        minReps: 8,
        rpeCap: 8,
        sets: 4,
      }),
      role: "primary",
    },
    {
      base: Prescription.Strength({
        reps: 8,
        rpeTarget: 8,
        sets: 3,
        weight: 50,
      }),
      exerciseId: "chest-supported-row",
      generateWarmup: false,
      id: "athletic-hypertrophy-upper-chest-supported-row",
      note: `${hypertrophyCompoundNote} Chest on the incline bench keeps the lower back out of it.`,
      progression: ProgressionPolicy.Double({
        increment: 5,
        maxReps: 12,
        minReps: 8,
        rpeCap: 8,
        sets: 3,
      }),
      role: "secondary",
    },
    isolationSlot({
      exerciseId: "lateral-raise",
      extraNote:
        "Superset with the rear-delt fly if the quality of both holds.",
      id: "athletic-hypertrophy-upper-lateral-raise",
      maxReps: 20,
      minReps: 12,
      sets: 4,
      weight: 15,
    }),
    isolationSlot({
      exerciseId: "rear-delt-fly",
      id: "athletic-hypertrophy-upper-rear-delt-fly",
      maxReps: 20,
      minReps: 12,
      sets: 3,
      weight: 15,
    }),
    isolationSlot({
      exerciseId: "hammer-curl",
      extraNote:
        "Superset with the overhead triceps extension if the quality of both holds.",
      id: "athletic-hypertrophy-upper-hammer-curl",
      maxReps: 12,
      minReps: 8,
      sets: 3,
      weight: 30,
    }),
    isolationSlot({
      exerciseId: "overhead-triceps-extension",
      id: "athletic-hypertrophy-upper-overhead-triceps-extension",
      maxReps: 15,
      minReps: 10,
      sets: 3,
      weight: 40,
    }),
    isolationSlot({
      exerciseId: "dumbbell-fly",
      extraNote: "A cable fly is an equal substitute.",
      id: "athletic-hypertrophy-upper-dumbbell-fly",
      maxReps: 15,
      minReps: 12,
      sets: 2,
      weight: 30,
    }),
  ],
  tags: ["hypertrophy-upper"],
  targetDurationMin: 60,
};

const hypertrophyRowIntervals: SessionTemplate = {
  ...rowIntervals,
  constraints: {
    allowedDays: [6, 7],
    avoidPreviousDayTags: ["hard-row", "heavy-lower"],
    preferredDay: 6,
  },
  id: "athletic-hypertrophy-row-intervals",
};

/** Foundation's recovery day, with an easy 10K offered beside it. Either is
 *  optional: full rest is just as valid a Sunday. */
const hypertrophyRecovery: SessionTemplate = {
  alternatives: [
    {
      id: "athletic-hypertrophy-recovery-easy-movement",
      label: "Recovery — easy movement",
      slots: [recoveryEasyMovement],
    },
    {
      id: "athletic-hypertrophy-recovery-easy-10k",
      label: "Easy Row — 10K",
      slots: [
        {
          base: Prescription.DistanceCardio({ distanceMeters: 10_000 }),
          exerciseId: "rower",
          generateWarmup: false,
          id: "athletic-hypertrophy-recovery-easy-10k",
          note: "Optional — full rest is just as good a choice. Genuinely easy: Zone 1, conversational, 18–20 spm, no pace target. Skip it on any Sunday you aren't fresh.",
          progression: ProgressionPolicy.None(),
          role: "accessory",
        },
      ],
    },
  ],
  constraints: { preferredDay: 7 },
  focus: "cardio",
  id: "athletic-hypertrophy-recovery",
  name: "Recovery",
  tags: ["recovery"],
  targetDurationMin: 30,
};

const sessionTemplates: readonly SessionTemplate[] = [
  hypertrophyHeavyUpper,
  hypertrophyLongEasyCardio,
  hypertrophyHeavyLower,
  upperHypertrophy,
  hypertrophyRowIntervals,
  hypertrophyRecovery,
  zone2Row,
];

export const athleticHypertrophyV1: ProgramVersion = {
  blocks: [
    {
      deloadEveryWeeks: 4,
      durationWeeks: 8,
      id: "athletic-hypertrophy-block",
      name: "Athletic Hypertrophy",
      weekTemplate: {
        days: [
          {
            dayOfWeek: 1,
            sessionTemplateId: "athletic-hypertrophy-heavy-upper",
          },
          {
            dayOfWeek: 2,
            sessionTemplateId: "athletic-hypertrophy-long-easy-cardio",
          },
          {
            dayOfWeek: 3,
            sessionTemplateId: "athletic-hypertrophy-heavy-lower",
          },
          { dayOfWeek: 4, sessionTemplateId: "foundation-zone2-row" },
          { dayOfWeek: 5, sessionTemplateId: "athletic-hypertrophy-upper" },
          {
            dayOfWeek: 6,
            sessionTemplateId: "athletic-hypertrophy-row-intervals",
          },
          { dayOfWeek: 7, sessionTemplateId: "athletic-hypertrophy-recovery" },
        ],
      },
    },
  ],
  createdAt: "2026-10-24T00:00:00.000Z",
  id: "athletic-hypertrophy-v1",
  programId: "athletic-hypertrophy",
  sessionTemplates: [...sessionTemplates],
  version: 1,
};
