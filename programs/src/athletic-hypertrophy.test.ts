import { describe, expect, it } from "bun:test";
import type {
  ExerciseSlot,
  ProgramVersion,
  SessionTemplate,
  TrainingBlock,
} from "@titan/domain/program";
import { athleticHealthFoundationV1 } from "./athletic-health-foundation";
import { athleticHypertrophyV1 } from "./athletic-hypertrophy";
import { exercises } from "./exercises";

const templateIn = (version: ProgramVersion, id: string): SessionTemplate => {
  const template = version.sessionTemplates.find((entry) => entry.id === id);
  if (template === undefined) {
    throw new Error(`missing session template ${id}`);
  } else {
    return template;
  }
};

const templateById = (id: string): SessionTemplate =>
  templateIn(athleticHypertrophyV1, id);

const foundationTemplateById = (id: string): SessionTemplate =>
  templateIn(athleticHealthFoundationV1, id);

const hypertrophyBlock = (): TrainingBlock => {
  const [block] = athleticHypertrophyV1.blocks;
  if (block === undefined) {
    throw new Error("missing athletic hypertrophy block");
  } else {
    return block;
  }
};

describe("athletic hypertrophy", () => {
  it("is a single eight-week block on its own, so nothing rolls into it", () => {
    // Its own program rather than a block after Foundation: Foundation still
    // ends where it always did, and this block is only reached by selecting it.
    expect(athleticHypertrophyV1.blocks).toHaveLength(1);
    expect(hypertrophyBlock()).toMatchObject({
      deloadEveryWeeks: 4,
      durationWeeks: 8,
      id: "athletic-hypertrophy-block",
      name: "Athletic Hypertrophy",
    });
    expect(hypertrophyBlock().weekStructure).not.toBe("progression");
  });

  const fridaySlots = (): readonly ExerciseSlot[] =>
    templateById("athletic-hypertrophy-upper").slots ?? [];

  const fridaySlot = (exerciseId: string): ExerciseSlot => {
    const slot = fridaySlots().find((entry) => entry.exerciseId === exerciseId);
    if (slot === undefined) {
      throw new Error(`missing friday slot ${exerciseId}`);
    } else {
      return slot;
    }
  };

  it("lays the week out upper, long aerobic, lower, zone 2, upper, intervals, recovery", () => {
    const days = hypertrophyBlock().weekTemplate.days;
    expect(
      days.map((day) => [
        day.dayOfWeek,
        templateById(day.sessionTemplateId).name,
      ]),
    ).toEqual([
      [1, "Heavy Upper + Arms"],
      [2, "Long Easy Cardio"],
      [3, "Heavy Lower"],
      [4, "Zone 2 Row"],
      [5, "Upper Hypertrophy + Arms"],
      [6, "Row Intervals"],
      [7, "Recovery"],
    ]);
    for (const day of days) {
      expect(templateById(day.sessionTemplateId).constraints.preferredDay).toBe(
        day.dayOfWeek,
      );
    }
  });

  it("moves the foundation sessions without changing what they prescribe", () => {
    // Same slots, same slot ids: history is keyed by slot id, so every moved
    // lift, row, and alternative picks up from its Foundation loads and paces.
    for (const [moved, original] of [
      ["athletic-hypertrophy-heavy-upper", "foundation-heavy-upper"],
      ["athletic-hypertrophy-long-easy-cardio", "foundation-long-easy-cardio"],
      ["athletic-hypertrophy-heavy-lower", "foundation-heavy-lower"],
      ["athletic-hypertrophy-row-intervals", "foundation-row-intervals"],
    ] as const) {
      const {
        constraints: _movedConstraints,
        id: _movedId,
        name: _movedName,
        ...movedPrescription
      } = templateById(moved);
      const {
        constraints: _originalConstraints,
        id: _originalId,
        name: _originalName,
        ...originalPrescription
      } = foundationTemplateById(original);
      expect(movedPrescription).toEqual(originalPrescription);
    }
    expect(templateById("foundation-zone2-row")).toEqual(
      foundationTemplateById("foundation-zone2-row"),
    );
  });

  it("keeps the intervals off the day after heavy lower, rescheduling only into Sunday", () => {
    expect(
      templateById("athletic-hypertrophy-row-intervals").constraints,
    ).toEqual({
      allowedDays: [6, 7],
      avoidPreviousDayTags: ["hard-row", "heavy-lower"],
      preferredDay: 6,
    });
  });

  it("works the friday upper day as a fixed hypertrophy session with a core finisher", () => {
    expect(
      fridaySlots().map((slot) => [
        slot.exerciseId,
        slot.base.type,
        "sets" in slot.base ? slot.base.sets : undefined,
        slot.progression.kind === "double"
          ? [slot.progression.minReps, slot.progression.maxReps]
          : slot.progression.kind,
        slot.role,
      ]),
    ).toEqual([
      ["incline-bench-press", "strength", 4, [8, 10], "primary"],
      ["chest-supported-row", "strength", 3, [8, 12], "secondary"],
      ["lateral-raise", "strength", 4, [12, 20], "accessory"],
      ["rear-delt-fly", "strength", 3, [12, 20], "accessory"],
      ["hammer-curl", "strength", 3, [8, 12], "accessory"],
      ["overhead-triceps-extension", "strength", 3, [10, 15], "accessory"],
      ["dumbbell-fly", "strength", 2, [12, 15], "accessory"],
      ["hanging-knee-raise", "bodyweight", 3, [10, 15], "accessory"],
      ["side-plank", "timed-hold", 2, "timed-hold", "accessory"],
    ]);
  });

  it("totals 27 working sets in 70 minutes on friday, each side plank set covering both sides", () => {
    expect(templateById("athletic-hypertrophy-upper").targetDurationMin).toBe(
      70,
    );
    expect(
      fridaySlots().reduce(
        (total, slot) => total + ("sets" in slot.base ? slot.base.sets : 0),
        0,
      ),
    ).toBe(27);
    expect(
      exercises.find((exercise) => exercise.id === "side-plank")?.isUnilateral,
    ).toBe(true);
    expect(fridaySlot("side-plank").note).toContain("each side");
  });

  it("adds reps before load, starting each slot at the bottom of its range", () => {
    for (const slot of fridaySlots().filter(
      (entry) => entry.base.type !== "timed-hold",
    )) {
      expect(slot.progression).toMatchObject({ kind: "double", rpeCap: 8 });
      expect(slot.base).toMatchObject({
        reps:
          slot.progression.kind === "double"
            ? slot.progression.minReps
            : undefined,
      });
    }
    for (const slot of fridaySlots().filter(
      (entry) => entry.base.type === "strength",
    )) {
      expect(slot.base).toMatchObject({ rpeTarget: 8 });
    }
  });

  it("caps the side plank hold at 45s, loading it rather than holding longer", () => {
    expect(fridaySlot("side-plank")).toMatchObject({
      base: { holdSec: 30, sets: 2, type: "timed-hold", unit: "kg" },
      progression: {
        addWeightAfterSec: 45,
        holdIncrementSec: 5,
        kind: "timed-hold",
        sets: 2,
        startSec: 30,
      },
    });
  });

  it("spells out rest on every friday slot", () => {
    const [incline, row, ...rest] = fridaySlots();
    for (const compound of [incline, row]) {
      expect(compound?.note).toContain("Rest 2–3 min");
      expect(compound?.note).toContain("1–3 reps in reserve");
    }
    for (const slot of rest.filter(
      (entry) => entry.exerciseId !== "side-plank",
    )) {
      expect(slot.note).toContain("Rest 60–90s");
    }
    expect(fridaySlot("side-plank").note).toContain("Rest 30–60s");
  });

  it("offers an optional easy 10k beside the foundation recovery day", () => {
    const sunday = templateById("athletic-hypertrophy-recovery");
    const foundationRecovery = foundationTemplateById(
      "foundation-recovery",
    ).slots;
    expect(
      sunday.alternatives?.map((alternative) => [
        alternative.label,
        alternative.slots,
      ]),
    ).toEqual([
      ["Recovery — easy movement", foundationRecovery ?? []],
      [
        "Easy Row — 10K",
        [
          {
            base: { distanceMeters: 10_000, type: "distance-cardio" },
            exerciseId: "rower",
            generateWarmup: false,
            id: "athletic-hypertrophy-recovery-easy-10k",
            note: expect.stringContaining("Optional"),
            progression: { kind: "none" },
            role: "accessory",
          },
        ],
      ],
    ]);
  });
});
