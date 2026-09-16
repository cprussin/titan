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

/** Every slot across the whole program version — fixed slots, every variant's
 *  slots, and every alternative's slots. */
const allSlots: readonly ExerciseSlot[] =
  athleticHealthFoundationV1.sessionTemplates.flatMap((template) => [
    ...(template.slots ?? []),
    ...(template.variants ?? []).flatMap((variant) => variant.slots),
    ...(template.alternatives ?? []).flatMap(
      (alternative) => alternative.slots,
    ),
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
      "band-triceps-pushdown",
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

  it("works the triceps pushdown against a band, at no prescribed load", () => {
    const slot = allSlots.find(
      (entry) => entry.id === "foundation-heavy-upper-band-triceps-pushdown",
    );
    // A band has no load to progress, so the slot holds its 3×10 rather than
    // climbing a rep range toward a weight jump it can never make.
    expect(slot?.base).toEqual({ reps: 10, sets: 3, type: "band" });
    expect(slot?.progression).toEqual({ kind: "none" });
    expect(slot?.exerciseId).toBe("band-triceps-pushdown");
  });

  it("marks the accessories sheddable so recovery costs them first", () => {
    const roles = [
      "foundation-heavy-upper-lateral-raise",
      "foundation-heavy-upper-biceps-curl",
      "foundation-heavy-upper-band-triceps-pushdown",
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

describe("athletic day workout B", () => {
  const conditioningSlots = (): readonly ExerciseSlot[] => {
    const conditioning = templateById("foundation-athletic-day").variants?.[1];
    if (conditioning === undefined) {
      throw new Error("missing athletic day conditioning variant");
    } else {
      return conditioning.slots;
    }
  };

  const slotFor = (exerciseId: string): ExerciseSlot => {
    const found = conditioningSlots().find(
      (slot) => slot.exerciseId === exerciseId,
    );
    if (found === undefined) {
      throw new Error(`missing conditioning slot for ${exerciseId}`);
    } else {
      return found;
    }
  };

  it("opens with burpee intervals, then works the whole body", () => {
    // The full-body work-capacity variant of athletic day: the burpee intervals
    // carry the conditioning (and all the pressing volume the day needs), then
    // a squat, a pull, and a carry fill it out before the arm work.
    expect(conditioningSlots().map((slot) => slot.exerciseId)).toEqual([
      "burpee",
      "goblet-squat",
      "inverted-row",
      "farmer-carry",
      "hammer-curl",
      "lateral-raise",
    ]);
  });

  it("prescribes the burpees as six 45-second intervals with 75s recovery", () => {
    // A single timed interval exercise, not a circuit: rounds, work, and
    // recovery all read off the one prescription.
    expect(slotFor("burpee").base).toEqual({
      count: 6,
      recoverySec: 75,
      type: "intervals",
      workSec: 45,
    });
    expect(slotFor("burpee").role).toBe("primary");
  });

  it("spells out the full burpee, with no rep target inside an interval", () => {
    const note = slotFor("burpee").note ?? "";
    expect(note).toContain("push-up");
    expect(note).toContain("jump");
    expect(note).toContain("No rep target");
  });

  it("holds the goblet squat at 3×15 and autoregulates its load by RPE", () => {
    expect(slotFor("goblet-squat").base).toEqual({
      reps: 15,
      sets: 3,
      type: "strength",
      unit: "lb",
      weight: 50,
    });
    expect(slotFor("goblet-squat").progression).toEqual({
      bands: [{ increment: 5, maxRpe: 7 }],
      kind: "rpe-banded",
      reps: 15,
      sets: 3,
    });
  });

  it("walks the inverted row from 12 reps to 15 before adding load", () => {
    expect(slotFor("inverted-row").base).toEqual({
      reps: 12,
      sets: 3,
      type: "bodyweight",
      unit: "lb",
    });
    expect(slotFor("inverted-row").progression).toEqual({
      increment: 5,
      kind: "double",
      maxReps: 15,
      minReps: 12,
      rpeCap: 8,
      sets: 3,
    });
  });

  it("carries for three 45-second sets, progressing by load", () => {
    expect(slotFor("farmer-carry").base).toEqual({
      durationSec: 45,
      sets: 3,
      type: "timed-carry",
      unit: "lb",
      weight: 150,
    });
    expect(slotFor("farmer-carry").progression).toEqual({
      durationSec: 45,
      increment: 5,
      kind: "timed-carry",
      rpeCap: 8,
      sets: 3,
    });
  });
});

describe("saturday long easy cardio", () => {
  const saturday = (): SessionTemplate =>
    templateById("foundation-long-easy-cardio");

  it("offers four equivalent choices rather than a weekly rotation", () => {
    // Nothing about the day changes week to week: the athlete picks whichever
    // of the four they want that Saturday.
    expect(saturday().variants).toBeUndefined();
    expect(saturday().alternatives?.map((entry) => entry.label)).toEqual([
      "Row — 75 min",
      "Trail Run — 60 min",
      "Mountain Hike — 90 min",
      "Bike Ride — 75 min",
    ]);
  });

  it("prescribes each choice as one Zone 2 piece at its own duration", () => {
    expect(
      saturday().alternatives?.map((alternative) => [
        alternative.id,
        alternative.slots.map((slot) => [slot.exerciseId, slot.base]),
      ]),
    ).toEqual([
      [
        "foundation-long-easy-cardio-row",
        [
          [
            "rower",
            { durationSec: 4500, targetHrZone: 2, type: "timed-cardio" },
          ],
        ],
      ],
      [
        "foundation-long-easy-cardio-trail-run",
        [["run", { durationSec: 3600, targetHrZone: 2, type: "timed-cardio" }]],
      ],
      [
        "foundation-long-easy-cardio-hike",
        [
          [
            "hike",
            { durationSec: 5400, targetHrZone: 2, type: "timed-cardio" },
          ],
        ],
      ],
      [
        "foundation-long-easy-cardio-bike",
        [
          [
            "bike",
            { durationSec: 4500, targetHrZone: 2, type: "timed-cardio" },
          ],
        ],
      ],
    ]);
  });
});
