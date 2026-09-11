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

describe("foundation block aesthetic accessories", () => {
  it("closes the Wednesday upper day with delt and arm isolation", () => {
    const upper = templateById("foundation-heavy-upper");
    expect((upper.slots ?? []).map((slot) => slot.exerciseId)).toEqual([
      "bench-press",
      "weighted-pullup",
      "overhead-press",
      "barbell-row",
      "dips",
      "ab-wheel",
      "lateral-raise",
      "biceps-curl",
      "triceps-pushdown",
    ]);
  });

  it("closes every athletic-day variant with the same two accessory slots", () => {
    const athletic = templateById("foundation-athletic-day");
    expect(athletic.variants).toHaveLength(3);
    for (const variant of athletic.variants ?? []) {
      // One slot id per accessory across all three variants: history is keyed by
      // slot id, so the load carries whichever variant the week lands on.
      expect(
        variant.slots.slice(-2).map((slot) => [slot.exerciseId, slot.id]),
      ).toEqual([
        ["hammer-curl", "foundation-athletic-day-hammer-curl"],
        ["lateral-raise", "foundation-athletic-day-lateral-raise"],
      ]);
    }
  });

  it("leaves the Monday lower day alone", () => {
    const lower = templateById("foundation-heavy-lower");
    expect((lower.slots ?? []).map((slot) => slot.exerciseId)).toEqual([
      "back-squat",
      "romanian-deadlift",
      "bulgarian-split-squat",
      "standing-calf-raise",
      "plank",
      "rower",
    ]);
  });

  it("progresses each accessory by double progression inside its rep range", () => {
    for (const [slotId, sets, minReps, maxReps] of [
      ["foundation-heavy-upper-lateral-raise", 3, 15, 20],
      ["foundation-heavy-upper-biceps-curl", 3, 10, 12],
      ["foundation-heavy-upper-triceps-pushdown", 3, 10, 12],
      ["foundation-athletic-day-hammer-curl", 3, 10, 15],
      ["foundation-athletic-day-lateral-raise", 3, 12, 20],
    ] as const) {
      const slot = allSlots.find((entry) => entry.id === slotId);
      expect(slot?.progression).toEqual({
        increment: 5,
        kind: "double",
        maxReps,
        minReps,
        rpeCap: 8,
        sets,
      });
      // Starts at the bottom of the range so the reps climb before the load.
      expect(slot?.base).toMatchObject({ reps: minReps, sets });
    }
  });

  it("marks the accessories sheddable so recovery costs them first", () => {
    const roles = [
      "foundation-heavy-upper-lateral-raise",
      "foundation-heavy-upper-biceps-curl",
      "foundation-heavy-upper-triceps-pushdown",
      "foundation-athletic-day-hammer-curl",
      "foundation-athletic-day-lateral-raise",
    ].map((slotId) => allSlots.find((slot) => slot.id === slotId)?.role);
    expect(roles).toEqual([
      "accessory",
      "accessory",
      "accessory",
      "accessory",
      "accessory",
    ]);
  });
});

describe("farmer carry", () => {
  const slot = (): ExerciseSlot => {
    const found = allSlots.find((entry) => entry.exerciseId === "farmer-carry");
    if (found === undefined) {
      throw new Error("missing farmer-carry slot");
    } else {
      return found;
    }
  };

  it("prescribes three 40-second carries, not reps", () => {
    expect(slot().base).toEqual({
      durationSec: 40,
      sets: 3,
      type: "timed-carry",
      unit: "lb",
      weight: 150,
    });
  });

  it("progresses by load with the duration pinned at 40 seconds", () => {
    expect(slot().progression).toEqual({
      durationSec: 40,
      increment: 5,
      kind: "timed-carry",
      rpeCap: 8,
      sets: 3,
    });
  });

  it("tells the athlete how heavy 40 seconds should feel", () => {
    expect(slot().note).toContain("final 10 seconds");
  });

  it("runs after the day's pulling work, as a late-session accessory", () => {
    const power = templateById("foundation-athletic-day").variants?.[0]?.slots;
    const order = (power ?? []).map((entry) => entry.exerciseId);
    expect(order.indexOf("farmer-carry")).toBeGreaterThan(
      order.indexOf("weighted-pullup"),
    );
    expect(slot().role).toBe("accessory");
  });
});

describe("athletic day workout A", () => {
  const powerSlots = (): readonly ExerciseSlot[] => {
    const power = templateById("foundation-athletic-day").variants?.[0];
    if (power === undefined) {
      throw new Error("missing athletic day power variant");
    } else {
      return power.slots;
    }
  };

  it("opens with the push press, then the deadlift", () => {
    // The push press is the day's explosive lift, so it is pressed fresh and
    // the deadlift follows it.
    expect(powerSlots().map((slot) => slot.exerciseId)).toEqual([
      "push-press",
      "deadlift",
      "weighted-pullup",
      "farmer-carry",
      "hammer-curl",
      "lateral-raise",
    ]);
  });

  it("prescribes the deadlift for triples", () => {
    // Heavy Lower already carries the block's lower-body volume, so athletic
    // day takes the deadlift at 3×3 and stays a power day.
    const deadlift = powerSlots().find(
      (slot) => slot.exerciseId === "deadlift",
    );
    expect(deadlift?.base).toMatchObject({ reps: 3, sets: 3, weight: 125 });
    expect(deadlift?.progression).toMatchObject({
      kind: "linear",
      reps: 3,
      sets: 3,
    });
  });
});
