import { describe, expect, it } from "bun:test";
import type {
  BodyweightPrescription,
  StrengthPrescription,
} from "@titan/domain/prescription";
import type { ExerciseSlot, SessionTemplate } from "@titan/domain/program";
import { programSchema, programVersionSchema } from "@titan/domain/program";
import type { ProgressionPolicy } from "@titan/domain/progression-policy";
import { catalog } from "./catalog";

const templateSlots = (template: SessionTemplate): readonly ExerciseSlot[] => {
  const fixed = template.slots ?? [];
  const rotating = (template.variants ?? []).flatMap(
    (variant) => variant.slots,
  );
  return [...fixed, ...rotating];
};

const slotExerciseIds = (template: SessionTemplate): readonly string[] =>
  templateSlots(template).map((slot) => slot.exerciseId);

/** A barbell (kilogram-loaded) strength slot — the loads Connor plates by hand,
 *  which must stay on the whole-kilogram grid. */
type KgBarbellSlot = ExerciseSlot & { base: StrengthPrescription };

const isKgBarbell = (slot: ExerciseSlot): slot is KgBarbellSlot =>
  slot.base.type === "strength" && slot.base.unit === "kg";

const kgBarbellSlots = (): readonly KgBarbellSlot[] =>
  catalog.programs.flatMap(({ version }) =>
    version.sessionTemplates.flatMap(templateSlots).filter(isKgBarbell),
  );

/** The bodyweight movements loaded by hanging plates off a belt. They come off
 *  the same plate tree as the barbell, so they are prescribed on the metric
 *  grid rather than in pounds. */
const BELT_LOADED_EXERCISE_IDS = new Set(["dips", "pullup", "weighted-pullup"]);

type BeltLoadedSlot = ExerciseSlot & { base: BodyweightPrescription };

const isBeltLoaded = (slot: ExerciseSlot): slot is BeltLoadedSlot =>
  slot.base.type === "bodyweight" &&
  BELT_LOADED_EXERCISE_IDS.has(slot.exerciseId);

const beltLoadedSlots = (): readonly BeltLoadedSlot[] =>
  catalog.programs.flatMap(({ version }) =>
    version.sessionTemplates.flatMap(templateSlots).filter(isBeltLoaded),
  );

/** The load steps a policy adds, in the exercise's unit; empty for policies that
 *  don't progress by load (timed holds, intervals, AMRAP, none). */
const progressionIncrements = (
  policy: ProgressionPolicy,
): readonly number[] => {
  switch (policy.kind) {
    case "linear":
    case "double": {
      return [policy.increment];
    }
    case "rpe-banded": {
      return policy.bands.map((band) => band.increment);
    }
    default: {
      return [];
    }
  }
};

describe("catalog", () => {
  it("contains the four initial programs", () => {
    expect(catalog.programs).toHaveLength(4);
  });

  it("holds valid program and program-version data", () => {
    for (const { program, version } of catalog.programs) {
      expect(programSchema.parse(program)).toEqual(program);
      expect(programVersionSchema.parse(version)).toEqual(version);
    }
  });

  it("progresses kg barbell lifts in whole-kilogram increments", () => {
    const increments = kgBarbellSlots().flatMap((slot) =>
      progressionIncrements(slot.progression),
    );
    for (const increment of increments) {
      expect(Number.isInteger(increment)).toBe(true);
    }
  });

  it("prescribes kg barbell lifts at whole-kilogram starting loads", () => {
    for (const slot of kgBarbellSlots()) {
      expect(Number.isInteger(slot.base.weight)).toBe(true);
    }
  });

  it("loads belt-loaded bodyweight movements in kilograms", () => {
    for (const slot of beltLoadedSlots()) {
      expect(slot.base.unit).toBe("kg");
    }
  });

  it("progresses belt-loaded bodyweight movements in whole-kilogram increments", () => {
    const increments = beltLoadedSlots().flatMap((slot) =>
      progressionIncrements(slot.progression),
    );
    for (const increment of increments) {
      expect(Number.isInteger(increment)).toBe(true);
    }
  });

  it("prescribes belt-loaded bodyweight movements at whole-kilogram added loads", () => {
    for (const slot of beltLoadedSlots()) {
      expect(Number.isInteger(slot.base.addedWeight ?? 0)).toBe(true);
    }
  });

  it("references only exercises that exist in the catalog", () => {
    const knownIds = new Set(catalog.exercises.map((exercise) => exercise.id));
    const referenced = catalog.programs.flatMap(({ version }) =>
      version.sessionTemplates.flatMap(slotExerciseIds),
    );
    for (const exerciseId of referenced) {
      expect(knownIds.has(exerciseId)).toBe(true);
    }
  });
});
