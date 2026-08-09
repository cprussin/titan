import { z } from "zod";
import { idSchema } from "./ids";
import { movementPatternSchema } from "./movement";
import { prescriptionSchema } from "./prescription";
import { progressionPolicySchema } from "./progression-policy";

/**
 * The **program definition** layer: the versioned, immutable data that
 * describes a training program. A program is data, not code (see the spec's
 * "Program System"). Editing a program mints a new {@link ProgramVersion};
 * historical workouts keep referencing the version they were prescribed from.
 *
 * Shape: `Program → ProgramVersion → TrainingBlock → WeekTemplate → SessionTemplate
 * → ExerciseSlot → ProgressionPolicy`.
 */

/** The role an exercise plays in a session. Session adaptation preserves the
 *  primary movement and sheds `accessory` slots first (see the spec's "Session
 *  Adaptation"). */
export const slotRoleSchema = z.enum(["primary", "secondary", "accessory"]);

export type SlotRole = z.infer<typeof slotRoleSchema>;

export const exerciseSlotSchema = z.object({
  /** The starting prescription (week 1 of a fresh block). The engine evolves it
   *  from here using {@link progression} and recorded history. */
  base: prescriptionSchema,
  exerciseId: idSchema,
  /** Whether the engine auto-generates warm-up sets for this slot (barbell
   *  strength work). */
  generateWarmup: z.boolean(),
  id: idSchema,
  note: z.string().optional(),
  progression: progressionPolicySchema,
  role: slotRoleSchema,
});

export type ExerciseSlot = z.infer<typeof exerciseSlotSchema>;

/** A named rotation of a session — Row Intervals cycles Week A/B/C/D, Athletic
 *  Day cycles Power/Conditioning/Hill Sprint. The engine selects a variant by
 *  the current week index. */
export const sessionVariantSchema = z.object({
  label: z.string(),
  slots: z.array(exerciseSlotSchema),
});

export type SessionVariant = z.infer<typeof sessionVariantSchema>;

/** Constraint-based scheduling metadata (see the spec's "Scheduler"). */
export const sessionConstraintsSchema = z.object({
  /** ISO weekdays (1=Mon…7=Sun) the session may be scheduled on. */
  allowedDays: z.array(z.number().int().min(1).max(7)).optional(),
  /** Session tags that must NOT appear on the previous day (e.g. a hard row
   *  can't follow another hard row or heavy lower-body work). */
  avoidPreviousDayTags: z.array(z.string()).optional(),
  /** ISO weekday the session is preferentially scheduled on. */
  preferredDay: z.number().int().min(1).max(7).optional(),
});

export type SessionConstraints = z.infer<typeof sessionConstraintsSchema>;

export const sessionTemplateSchema = z.object({
  constraints: sessionConstraintsSchema,
  /** The dominant movement pattern, used by scheduler constraints and tagging. */
  focus: movementPatternSchema.optional(),
  id: idSchema,
  name: z.string(),
  /** Fixed slots for a non-rotating session. Exactly one of `slots`/`variants`
   *  is populated. */
  slots: z.array(exerciseSlotSchema).optional(),
  /** Freeform coaching tags used by scheduler constraints (e.g. "hard-row",
   *  "heavy-lower"). */
  tags: z.array(z.string()),
  targetDurationMin: z.number().int().positive(),
  /** Weekly rotation for a rotating session; the engine picks by week index. */
  variants: z.array(sessionVariantSchema).optional(),
});

export type SessionTemplate = z.infer<typeof sessionTemplateSchema>;

/** One day of a week: which session (if any) is scheduled on this ISO weekday. */
export const daySessionSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  sessionTemplateId: idSchema,
});

export type DaySession = z.infer<typeof daySessionSchema>;

export const weekTemplateSchema = z.object({
  days: z.array(daySessionSchema),
});

export type WeekTemplate = z.infer<typeof weekTemplateSchema>;

export const trainingBlockSchema = z.object({
  /** Insert a deload every N training weeks (e.g. 4 → every 4th week). Absent
   *  means no scheduled deload. */
  deloadEveryWeeks: z.number().int().positive().optional(),
  durationWeeks: z.number().int().positive(),
  id: idSchema,
  name: z.string(),
  /** How the block's weeks relate. `"progression"` — each week is a distinct
   *  step in a bounded arc (e.g. a reentry ramp), so the block reads week by
   *  week and hands off to whatever follows. `"repeating"` (the default when
   *  absent) — a stable weekly template cycled with progression and deloads, the
   *  same shape every week, with no fixed end to announce. */
  weekStructure: z.enum(["progression", "repeating"]).optional(),
  /** The repeating weekly layout for the block. */
  weekTemplate: weekTemplateSchema,
});

export type TrainingBlock = z.infer<typeof trainingBlockSchema>;

export const programVersionSchema = z.object({
  blocks: z.array(trainingBlockSchema),
  createdAt: z.string(),
  id: idSchema,
  programId: idSchema,
  /** Session templates referenced by the blocks, keyed by id. Bundled with the
   *  version so a version is self-contained and immutable. */
  sessionTemplates: z.array(sessionTemplateSchema),
  version: z.number().int().positive(),
});

export type ProgramVersion = z.infer<typeof programVersionSchema>;

export const programSchema = z.object({
  description: z.string(),
  /** Ordered primary goals (most important first), from the spec. */
  goals: z.array(z.string()),
  id: idSchema,
  name: z.string(),
  /** When set, the program has been deleted but is retained because logged
   *  workouts still reference its versions. Tombstoned programs are hidden from
   *  the explorer; the history they back stays intact. Absent on live programs. */
  tombstonedAt: z.string().optional(),
});

export type Program = z.infer<typeof programSchema>;
