import { describe, expect, it } from "bun:test";
import type { ExerciseSlot, SessionTemplate } from "@titan/domain/program";
import { athleticHealthFoundationV1 } from "./athletic-health-foundation";

const templateById = (id: string): SessionTemplate => {
  const template = athleticHealthFoundationV1.sessionTemplates.find(
    (entry) => entry.id === id,
  );
  if (template === undefined) {
    throw new Error(`missing session template ${id}`);
  } else {
    return template;
  }
};

/** Every slot across the whole program version — fixed slots and every
 *  variant's slots. */
const allSlots: readonly ExerciseSlot[] =
  athleticHealthFoundationV1.sessionTemplates.flatMap((template) => [
    ...(template.slots ?? []),
    ...(template.variants ?? []).flatMap((variant) => variant.slots),
  ]);

const slotIdsFor = (exerciseId: string): Set<string> =>
  new Set(
    allSlots
      .filter((slot) => slot.exerciseId === exerciseId)
      .map((slot) => slot.id),
  );

describe("athleticHealthFoundationV1", () => {
  it("opens with a 4-week reentry block, then the 8-week foundation block", () => {
    expect(athleticHealthFoundationV1.blocks).toHaveLength(2);
    const [reentry, foundation] = athleticHealthFoundationV1.blocks;
    expect(reentry?.durationWeeks).toBe(4);
    expect(reentry?.deloadEveryWeeks).toBeUndefined();
    expect(foundation?.durationWeeks).toBe(8);
    expect(foundation?.deloadEveryWeeks).toBe(4);
  });

  it("marks reentry as a week-by-week progression and foundation as repeating", () => {
    const [reentry, foundation] = athleticHealthFoundationV1.blocks;
    // Reentry's weeks are fundamentally different, so it is shown week by week
    // and hands off to Foundation; Foundation repeats one weekly template.
    expect(reentry?.weekStructure).toBe("progression");
    expect(foundation?.weekStructure).not.toBe("progression");
  });

  it("adapts the reentry strength day by week via one variant per week", () => {
    const monday = templateById("ahf-reentry-strength-mon");
    expect(monday.variants).toHaveLength(4);
    // Week 1 is Full Body A (squats); Week 4 is the lower-strength ramp — a
    // different slot set, selected by week index, not by history.
    const week1 = monday.variants?.[0]?.slots ?? [];
    const week4 = monday.variants?.[3]?.slots ?? [];
    expect(week1.map((slot) => slot.exerciseId)).not.toEqual(
      week4.map((slot) => slot.exerciseId),
    );
  });

  it("alternates Full Body A/B across weeks 1 and 2", () => {
    const monday = templateById("ahf-reentry-strength-mon");
    const wednesday = templateById("ahf-reentry-strength-wed");
    // Monday week 1 is A (contains back-squat); Wednesday week 1 is B (deadlift).
    expect(
      monday.variants?.[0]?.slots.some(
        (slot) => slot.exerciseId === "back-squat",
      ),
    ).toBe(true);
    expect(
      wednesday.variants?.[0]?.slots.some(
        (slot) => slot.exerciseId === "deadlift",
      ),
    ).toBe(true);
    // Monday flips to B in week 2, Wednesday flips to A.
    expect(
      monday.variants?.[1]?.slots.some(
        (slot) => slot.exerciseId === "deadlift",
      ),
    ).toBe(true);
    expect(
      wednesday.variants?.[1]?.slots.some(
        (slot) => slot.exerciseId === "back-squat",
      ),
    ).toBe(true);
  });

  it("threads each compound through one shared slot id so foundation starts from reentry loads", () => {
    // A single stable slot id per lift, used in BOTH the reentry block and the
    // foundation block, is what carries the working load forward through the
    // history model (slot history is keyed by slot id).
    for (const [exerciseId, slotId] of [
      ["back-squat", "ahf-back-squat"],
      ["bench-press", "ahf-bench-press"],
      ["deadlift", "ahf-deadlift"],
      ["romanian-deadlift", "ahf-romanian-deadlift"],
      ["overhead-press", "ahf-overhead-press"],
      ["barbell-row", "ahf-barbell-row"],
    ] as const) {
      expect(slotIdsFor(exerciseId)).toEqual(new Set([slotId]));
      // The lift must actually appear in more than one place to carry.
      expect(
        allSlots.filter((slot) => slot.id === slotId).length,
      ).toBeGreaterThan(1);
    }
  });
});
