import { describe, expect, it } from "bun:test";
import type { SessionTemplate } from "@titan/domain/program";
import { programSchema, programVersionSchema } from "@titan/domain/program";
import { catalog } from "./catalog";

const slotExerciseIds = (template: SessionTemplate): readonly string[] => {
  const fixed = (template.slots ?? []).map((slot) => slot.exerciseId);
  const rotating = (template.variants ?? []).flatMap((variant) =>
    variant.slots.map((slot) => slot.exerciseId),
  );
  return [...fixed, ...rotating];
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
