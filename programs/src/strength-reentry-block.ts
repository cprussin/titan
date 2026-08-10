import { Prescription } from "@titan/domain/prescription";
import type {
  ExerciseSlot,
  SessionTemplate,
  TrainingBlock,
} from "@titan/domain/program";
import { ProgressionPolicy } from "@titan/domain/progression-policy";

/**
 * The **Strength Reentry** block — the first four weeks of Athletic Health
 * Foundation, for an aerobically-fit athlete returning to strength work. It
 * restores tolerance and current working loads before the Foundation Block,
 * without any max testing.
 *
 * Two things make it a plain block rather than a special case:
 *
 * - **It adapts by week number.** The weekly day structure is fixed (three
 *   strength days, a row day, a Zone 2 day, an aerobic day, recovery); each
 *   strength/row day is a session template whose four {@link SessionVariant}s —
 *   one per week — are selected by the week index. So Week 1 reintroduces the
 *   lifts, Weeks 2–3 progress volume, and Week 4 rehearses the Foundation
 *   layout, all from one repeating block.
 * - **It hands its loads to the Foundation Block.** Each barbell lift keeps the
 *   same `ahf-*` slot id it carries in the Foundation Block, and history is keyed
 *   by slot id, so once the athlete rolls into Foundation Week 1 its lifts start
 *   from the loads established here — continuity, not retesting.
 *
 * Strength compounds progress by RPE band ({@link ProgressionPolicy.RpeBanded}):
 * bigger jumps when the final set is easy, holds when it is hard or unrecorded.
 */

/** Weeks 1–2 barbell compound step: +5 kg when the final set is ≤6, +2.5 kg
 *  through 7.5, hold above — deliberately conservative reintroduction. */
const reintroCompound = (sets: number, reps: number): ProgressionPolicy =>
  ProgressionPolicy.RpeBanded({
    bands: [
      { increment: 5, maxRpe: 6 },
      { increment: 2.5, maxRpe: 7.5 },
    ],
    reps,
    sets,
  });

/** Week 3–4 barbell compound step (the global reentry table): +5 kg when the
 *  final set is ≤6, +2.5 kg through 8, hold above. */
const mixedCompound = (sets: number, reps: number): ProgressionPolicy =>
  ProgressionPolicy.RpeBanded({
    bands: [
      { increment: 5, maxRpe: 6 },
      { increment: 2.5, maxRpe: 8 },
    ],
    reps,
    sets,
  });

/** Secondary / assistance barbell step: +2.5 kg when the final set is ≤7, hold
 *  above. */
const rpe7Step = (sets: number, reps: number): ProgressionPolicy =>
  ProgressionPolicy.RpeBanded({
    bands: [{ increment: 2.5, maxRpe: 7 }],
    reps,
    sets,
  });

/** The dumbbell counterpart to {@link rpe7Step}: +5 lb when the final set is
 *  ≤7, hold above. Dumbbell accessory loads stay imperial. */
const rpe7StepLb = (sets: number, reps: number): ProgressionPolicy =>
  ProgressionPolicy.RpeBanded({
    bands: [{ increment: 5, maxRpe: 7 }],
    reps,
    sets,
  });

const plankProgression = (sets: number): ProgressionPolicy =>
  ProgressionPolicy.TimedHold({
    addWeightAfterSec: 120,
    holdIncrementSec: 10,
    sets,
    startSec: 60,
  });

const easyRowFinisher = (id: string): ExerciseSlot => ({
  base: Prescription.TimedCardio({ durationSec: 600, targetHrZone: 1 }),
  exerciseId: "rower",
  generateWarmup: false,
  id,
  note: "Optional easy row; not tracked for rowing progression.",
  progression: ProgressionPolicy.None(),
  role: "accessory",
});

const fullBodyA: readonly ExerciseSlot[] = [
  {
    base: Prescription.Strength({
      reps: 5,
      rpeTarget: 6,
      sets: 3,
      unit: "kg",
      weight: 60,
    }),
    exerciseId: "back-squat",
    generateWarmup: true,
    id: "ahf-back-squat",
    progression: reintroCompound(3, 5),
    role: "primary",
  },
  {
    base: Prescription.Strength({
      reps: 5,
      rpeTarget: 6,
      sets: 3,
      unit: "kg",
      weight: 52.5,
    }),
    exerciseId: "bench-press",
    generateWarmup: true,
    id: "ahf-bench-press",
    progression: reintroCompound(3, 5),
    role: "secondary",
  },
  {
    base: Prescription.Strength({ reps: 8, sets: 2, unit: "kg", weight: 42.5 }),
    exerciseId: "romanian-deadlift",
    generateWarmup: true,
    id: "ahf-romanian-deadlift",
    note: "Keep loading conservative — eccentric stress and DOMS risk.",
    progression: rpe7Step(2, 8),
    role: "secondary",
  },
  {
    base: Prescription.Bodyweight({ reps: 5, sets: 3 }),
    exerciseId: "pullup",
    generateWarmup: false,
    id: "ahf-reentry-pullup",
    note: "Add reps within range before load; stay bodyweight through Weeks 1–2.",
    progression: ProgressionPolicy.Double({
      increment: 5,
      maxReps: 8,
      minReps: 5,
      rpeCap: 7,
      sets: 3,
    }),
    role: "accessory",
  },
  {
    base: Prescription.Bodyweight({ reps: 6, sets: 2 }),
    exerciseId: "ab-wheel",
    generateWarmup: false,
    id: "ahf-ab-wheel",
    progression: ProgressionPolicy.Amrap({ repCap: 10, sets: 2 }),
    role: "accessory",
  },
  easyRowFinisher("ahf-reentry-full-body-a-finisher"),
];

const fullBodyB: readonly ExerciseSlot[] = [
  {
    base: Prescription.Strength({
      reps: 5,
      rpeTarget: 6,
      sets: 2,
      unit: "kg",
      weight: 85,
    }),
    exerciseId: "deadlift",
    generateWarmup: true,
    id: "ahf-deadlift",
    progression: reintroCompound(2, 5),
    role: "primary",
  },
  {
    base: Prescription.Strength({ reps: 5, sets: 3, unit: "kg", weight: 35 }),
    exerciseId: "overhead-press",
    generateWarmup: true,
    id: "ahf-overhead-press",
    progression: rpe7Step(3, 5),
    role: "secondary",
  },
  {
    base: Prescription.Strength({ reps: 8, sets: 3, unit: "kg", weight: 42.5 }),
    exerciseId: "barbell-row",
    generateWarmup: true,
    id: "ahf-barbell-row",
    progression: rpe7Step(3, 8),
    role: "secondary",
  },
  {
    base: Prescription.Strength({ reps: 8, sets: 2, weight: 30 }),
    exerciseId: "bulgarian-split-squat",
    generateWarmup: false,
    id: "ahf-reentry-bulgarian-split-squat",
    note: "Reps per leg. Prioritize range of motion and stability over load.",
    progression: rpe7StepLb(2, 8),
    role: "accessory",
  },
  {
    base: Prescription.TimedHold({ holdSec: 60, sets: 2 }),
    exerciseId: "plank",
    generateWarmup: false,
    id: "ahf-plank",
    progression: plankProgression(2),
    role: "accessory",
  },
  easyRowFinisher("ahf-reentry-full-body-b-finisher"),
];

const fullBodyAWeek3: readonly ExerciseSlot[] = [
  {
    base: Prescription.Strength({
      reps: 5,
      rpeTarget: 8,
      sets: 4,
      unit: "kg",
      weight: 70,
    }),
    exerciseId: "back-squat",
    generateWarmup: true,
    id: "ahf-back-squat",
    progression: mixedCompound(4, 5),
    role: "primary",
  },
  {
    base: Prescription.Strength({
      reps: 5,
      rpeTarget: 8,
      sets: 4,
      unit: "kg",
      weight: 57.5,
    }),
    exerciseId: "bench-press",
    generateWarmup: true,
    id: "ahf-bench-press",
    progression: mixedCompound(4, 5),
    role: "secondary",
  },
  {
    base: Prescription.Strength({
      reps: 8,
      rpeTarget: 7,
      sets: 3,
      unit: "kg",
      weight: 47.5,
    }),
    exerciseId: "romanian-deadlift",
    generateWarmup: true,
    id: "ahf-romanian-deadlift",
    progression: rpe7Step(3, 8),
    role: "secondary",
  },
  {
    base: Prescription.Bodyweight({ reps: 6, sets: 3 }),
    exerciseId: "pullup",
    generateWarmup: false,
    id: "ahf-reentry-pullup",
    progression: ProgressionPolicy.Double({
      increment: 5,
      maxReps: 10,
      minReps: 6,
      rpeCap: 7,
      sets: 3,
    }),
    role: "accessory",
  },
  {
    base: Prescription.Bodyweight({ reps: 6, sets: 3 }),
    exerciseId: "ab-wheel",
    generateWarmup: false,
    id: "ahf-ab-wheel",
    progression: ProgressionPolicy.Amrap({ repCap: 15, sets: 3 }),
    role: "accessory",
  },
];

const fullBodyBWeek3: readonly ExerciseSlot[] = [
  {
    base: Prescription.Strength({
      reps: 5,
      rpeTarget: 8,
      sets: 3,
      unit: "kg",
      weight: 92.5,
    }),
    exerciseId: "deadlift",
    generateWarmup: true,
    id: "ahf-deadlift",
    progression: mixedCompound(3, 5),
    role: "primary",
  },
  {
    base: Prescription.Strength({ reps: 5, sets: 3, unit: "kg", weight: 37.5 }),
    exerciseId: "overhead-press",
    generateWarmup: true,
    id: "ahf-overhead-press",
    progression: rpe7Step(3, 5),
    role: "secondary",
  },
  {
    base: Prescription.Strength({ reps: 8, sets: 3, unit: "kg", weight: 47.5 }),
    exerciseId: "barbell-row",
    generateWarmup: true,
    id: "ahf-barbell-row",
    progression: rpe7Step(3, 8),
    role: "secondary",
  },
  {
    base: Prescription.Strength({ reps: 8, sets: 3, weight: 35 }),
    exerciseId: "bulgarian-split-squat",
    generateWarmup: false,
    id: "ahf-reentry-bulgarian-split-squat",
    note: "Reps per leg.",
    progression: rpe7StepLb(3, 8),
    role: "accessory",
  },
  {
    base: Prescription.TimedHold({ holdSec: 60, sets: 3 }),
    exerciseId: "plank",
    generateWarmup: false,
    id: "ahf-plank",
    progression: plankProgression(3),
    role: "accessory",
  },
];

const week4Lower: readonly ExerciseSlot[] = [
  {
    base: Prescription.Strength({
      reps: 5,
      rpeTarget: 8,
      sets: 5,
      unit: "kg",
      weight: 75,
    }),
    exerciseId: "back-squat",
    generateWarmup: true,
    id: "ahf-back-squat",
    progression: mixedCompound(5, 5),
    role: "primary",
  },
  {
    base: Prescription.Strength({
      reps: 8,
      rpeTarget: 7,
      sets: 3,
      unit: "kg",
      weight: 52.5,
    }),
    exerciseId: "romanian-deadlift",
    generateWarmup: true,
    id: "ahf-romanian-deadlift",
    progression: rpe7Step(3, 8),
    role: "secondary",
  },
  {
    base: Prescription.Strength({ reps: 10, sets: 2, weight: 35 }),
    exerciseId: "bulgarian-split-squat",
    generateWarmup: false,
    id: "ahf-reentry-bulgarian-split-squat",
    note: "Reps per leg.",
    progression: rpe7StepLb(2, 10),
    role: "accessory",
  },
  {
    base: Prescription.Strength({ reps: 15, sets: 2, weight: 90 }),
    exerciseId: "standing-calf-raise",
    generateWarmup: false,
    id: "ahf-reentry-standing-calf-raise",
    progression: ProgressionPolicy.Double({
      increment: 10,
      maxReps: 20,
      minReps: 15,
      rpeCap: 8,
      sets: 2,
    }),
    role: "accessory",
  },
  {
    base: Prescription.TimedHold({ holdSec: 60, sets: 2 }),
    exerciseId: "plank",
    generateWarmup: false,
    id: "ahf-plank",
    progression: plankProgression(2),
    role: "accessory",
  },
  easyRowFinisher("ahf-reentry-week4-lower-finisher"),
];

const week4Upper: readonly ExerciseSlot[] = [
  {
    base: Prescription.Strength({
      reps: 5,
      rpeTarget: 8,
      sets: 5,
      unit: "kg",
      weight: 60,
    }),
    exerciseId: "bench-press",
    generateWarmup: true,
    id: "ahf-bench-press",
    progression: mixedCompound(5, 5),
    role: "primary",
  },
  {
    base: Prescription.Bodyweight({ reps: 6, sets: 4 }),
    exerciseId: "pullup",
    generateWarmup: false,
    id: "ahf-reentry-pullup",
    note: "Add weight only if bodyweight is clearly below target effort.",
    progression: ProgressionPolicy.Double({
      increment: 5,
      maxReps: 6,
      minReps: 6,
      rpeCap: 6,
      sets: 4,
    }),
    role: "secondary",
  },
  {
    base: Prescription.Strength({ reps: 8, sets: 3, unit: "kg", weight: 37.5 }),
    exerciseId: "overhead-press",
    generateWarmup: true,
    id: "ahf-overhead-press",
    progression: rpe7Step(3, 8),
    role: "secondary",
  },
  {
    base: Prescription.Strength({ reps: 8, sets: 3, unit: "kg", weight: 47.5 }),
    exerciseId: "barbell-row",
    generateWarmup: true,
    id: "ahf-barbell-row",
    progression: rpe7Step(3, 8),
    role: "secondary",
  },
  {
    base: Prescription.Bodyweight({ reps: 10, sets: 2 }),
    exerciseId: "dips",
    generateWarmup: false,
    id: "ahf-reentry-dips",
    note: "Stop each set before failure.",
    progression: ProgressionPolicy.None(),
    role: "accessory",
  },
  {
    base: Prescription.Bodyweight({ reps: 6, sets: 2 }),
    exerciseId: "ab-wheel",
    generateWarmup: false,
    id: "ahf-ab-wheel",
    progression: ProgressionPolicy.Amrap({ repCap: 15, sets: 2 }),
    role: "accessory",
  },
];

const week4Athletic: readonly ExerciseSlot[] = [
  {
    base: Prescription.Strength({
      reps: 5,
      rpeTarget: 7,
      sets: 3,
      unit: "kg",
      weight: 92.5,
    }),
    exerciseId: "deadlift",
    generateWarmup: true,
    id: "ahf-deadlift",
    note: "Submaximal — keep it athletic, not a maximal strength session.",
    progression: rpe7Step(3, 5),
    role: "primary",
  },
  {
    base: Prescription.Strength({
      reps: 3,
      rpeTarget: 7,
      sets: 4,
      unit: "kg",
      weight: 42.5,
    }),
    exerciseId: "push-press",
    generateWarmup: true,
    id: "ahf-reentry-push-press",
    progression: ProgressionPolicy.None(),
    role: "secondary",
  },
  {
    base: Prescription.Strength({ reps: 1, sets: 3, weight: 120 }),
    exerciseId: "farmer-carry",
    generateWarmup: false,
    id: "ahf-reentry-farmer-carry",
    note: "Three carries; distance configurable to available space.",
    progression: ProgressionPolicy.None(),
    role: "accessory",
  },
  {
    base: Prescription.Bodyweight({ reps: 6, sets: 2 }),
    exerciseId: "pullup",
    generateWarmup: false,
    id: "ahf-reentry-pullup",
    progression: ProgressionPolicy.Double({
      increment: 5,
      maxReps: 6,
      minReps: 6,
      rpeCap: 6,
      sets: 2,
    }),
    role: "accessory",
  },
];

const steadyRow: readonly ExerciseSlot[] = [
  {
    base: Prescription.DistanceCardio({ distanceMeters: 10_000 }),
    exerciseId: "rower",
    generateWarmup: false,
    id: "ahf-reentry-steady-row-rower",
    note: "Row deliberately slower than a previous daily 10k pace; no pace progression.",
    progression: ProgressionPolicy.None(),
    role: "primary",
  },
];

const rowIntervals4x1000: readonly ExerciseSlot[] = [
  {
    base: Prescription.Intervals({
      count: 4,
      recoverySec: 180,
      workDistanceMeters: 1000,
    }),
    exerciseId: "rower",
    generateWarmup: false,
    id: "ahf-reentry-row-intervals-4x1000-rower",
    note: "Establish a current high-intensity baseline; do not chase historical pace.",
    progression: ProgressionPolicy.None(),
    role: "primary",
  },
];

const rowIntervals6x500: readonly ExerciseSlot[] = [
  {
    base: Prescription.Intervals({
      count: 6,
      recoverySec: 120,
      workDistanceMeters: 500,
    }),
    exerciseId: "rower",
    generateWarmup: false,
    id: "ahf-reentry-row-intervals-6x500-rower",
    note: "Baseline for Foundation interval progression; use Week 3 as the target guide.",
    progression: ProgressionPolicy.None(),
    role: "primary",
  },
];

const strengthMon: SessionTemplate = {
  constraints: { preferredDay: 1 },
  focus: "squat",
  id: "ahf-reentry-strength-mon",
  name: "Reentry Strength",
  tags: ["reentry-strength"],
  targetDurationMin: 60,
  variants: [
    { label: "Week 1 · Full Body A", slots: [...fullBodyA] },
    { label: "Week 2 · Full Body B", slots: [...fullBodyB] },
    { label: "Week 3 · Full Body A", slots: [...fullBodyAWeek3] },
    { label: "Week 4 · Lower Strength", slots: [...week4Lower] },
  ],
};

const strengthWed: SessionTemplate = {
  constraints: { preferredDay: 3 },
  focus: "hinge",
  id: "ahf-reentry-strength-wed",
  name: "Reentry Strength",
  tags: ["reentry-strength"],
  targetDurationMin: 60,
  variants: [
    { label: "Week 1 · Full Body B", slots: [...fullBodyB] },
    { label: "Week 2 · Full Body A", slots: [...fullBodyA] },
    { label: "Week 3 · Full Body B", slots: [...fullBodyBWeek3] },
    { label: "Week 4 · Upper Strength", slots: [...week4Upper] },
  ],
};

const strengthFri: SessionTemplate = {
  constraints: { preferredDay: 5 },
  focus: "squat",
  id: "ahf-reentry-strength-fri",
  name: "Reentry Strength",
  tags: ["reentry-strength"],
  targetDurationMin: 60,
  variants: [
    { label: "Week 1 · Full Body A", slots: [...fullBodyA] },
    { label: "Week 2 · Full Body B", slots: [...fullBodyB] },
    { label: "Week 3 · Full Body A", slots: [...fullBodyAWeek3] },
    { label: "Week 4 · Athletic / Power", slots: [...week4Athletic] },
  ],
};

const rowTue: SessionTemplate = {
  constraints: { preferredDay: 2 },
  focus: "cardio",
  id: "ahf-reentry-row-tue",
  name: "Reentry Row",
  tags: ["reentry-row"],
  targetDurationMin: 50,
  variants: [
    { label: "Week 1 · Steady 10k", slots: [...steadyRow] },
    { label: "Week 2 · Steady 10k", slots: [...steadyRow] },
    { label: "Week 3 · 4×1000m", slots: [...rowIntervals4x1000] },
    { label: "Week 4 · 6×500m", slots: [...rowIntervals6x500] },
  ],
};

const zone2Row: SessionTemplate = {
  constraints: { preferredDay: 4 },
  focus: "cardio",
  id: "ahf-reentry-zone2-row",
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
      id: "ahf-reentry-zone2-row-rower",
      note: "Track average HR, pace, and drift; no pace progression prescribed.",
      progression: ProgressionPolicy.None(),
      role: "primary",
    },
  ],
  tags: ["zone2"],
  targetDurationMin: 45,
};

const easyAerobic: SessionTemplate = {
  constraints: { preferredDay: 6 },
  focus: "cardio",
  id: "ahf-reentry-easy-aerobic",
  name: "Easy Aerobic",
  slots: [
    {
      base: Prescription.TimedCardio({ durationSec: 3000, targetHrZone: 2 }),
      exerciseId: "rower",
      generateWarmup: false,
      id: "ahf-reentry-easy-aerobic-rower",
      note: "Zone 2 / conversational. Row, trail run, hike, or bike are all fine.",
      progression: ProgressionPolicy.None(),
      role: "primary",
    },
  ],
  tags: ["easy-cardio"],
  targetDurationMin: 60,
};

const recovery: SessionTemplate = {
  constraints: { preferredDay: 7 },
  focus: "cardio",
  id: "ahf-reentry-recovery",
  name: "Recovery",
  slots: [
    {
      base: Prescription.TimedCardio({ durationSec: 1200, targetHrZone: 1 }),
      exerciseId: "rower",
      generateWarmup: false,
      id: "ahf-reentry-recovery-rower",
      note: "Optional: walking, mobility, stretching, or a very easy row.",
      progression: ProgressionPolicy.None(),
      role: "accessory",
    },
  ],
  tags: ["recovery"],
  targetDurationMin: 30,
};

/** The reentry block's session templates, to bundle into the program version. */
export const strengthReentrySessionTemplates: readonly SessionTemplate[] = [
  strengthMon,
  strengthWed,
  strengthFri,
  rowTue,
  zone2Row,
  easyAerobic,
  recovery,
];

/** The four-week Strength Reentry block that opens Athletic Health Foundation. */
export const strengthReentryBlock: TrainingBlock = {
  durationWeeks: 4,
  id: "athletic-health-foundation-reentry-block",
  name: "Strength Reentry",
  // Each week is a distinct step in a bounded ramp, so the block reads week by
  // week and hands off to the Foundation Block when it ends.
  weekStructure: "progression",
  weekTemplate: {
    days: [
      { dayOfWeek: 1, sessionTemplateId: "ahf-reentry-strength-mon" },
      { dayOfWeek: 2, sessionTemplateId: "ahf-reentry-row-tue" },
      { dayOfWeek: 3, sessionTemplateId: "ahf-reentry-strength-wed" },
      { dayOfWeek: 4, sessionTemplateId: "ahf-reentry-zone2-row" },
      { dayOfWeek: 5, sessionTemplateId: "ahf-reentry-strength-fri" },
      { dayOfWeek: 6, sessionTemplateId: "ahf-reentry-easy-aerobic" },
      { dayOfWeek: 7, sessionTemplateId: "ahf-reentry-recovery" },
    ],
  },
};
