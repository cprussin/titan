import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import type { SessionTemplate } from "@titan/domain/program";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import { selectVariant } from "./variant";

const slot = (id: string) => ({
  base: Prescription.Strength({ reps: 5, sets: 5, weight: 100 }),
  exerciseId: `ex-${id}`,
  generateWarmup: true,
  id,
  progression: ProgressionPolicy.None(),
  role: "primary" as const,
});

const rotating: SessionTemplate = {
  constraints: {},
  id: "row-intervals",
  name: "Row Intervals",
  tags: ["hard-row"],
  targetDurationMin: 50,
  variants: [
    { label: "Week A", slots: [slot("a")] },
    { label: "Week B", slots: [slot("b")] },
  ],
};

const fixed: SessionTemplate = {
  constraints: {},
  id: "heavy-lower",
  name: "Heavy Lower",
  slots: [slot("squat")],
  tags: ["heavy-lower"],
  targetDurationMin: 60,
};

const chooseable: SessionTemplate = {
  alternatives: [
    { id: "row", label: "Row — 75 min", slots: [slot("row")] },
    { id: "hike", label: "Mountain Hike — 90 min", slots: [slot("hike")] },
  ],
  constraints: {},
  id: "long-easy-cardio",
  name: "Long Easy Cardio",
  tags: ["easy-cardio"],
  targetDurationMin: 75,
};

describe("selectVariant", () => {
  it("cycles variants by week for a rotating session", () => {
    expect(selectVariant(rotating, 1).label).toBe("Week A");
    expect(selectVariant(rotating, 2).label).toBe("Week B");
    expect(selectVariant(rotating, 3).label).toBe("Week A");
  });

  it("returns the fixed slots for a non-rotating session", () => {
    const selected = selectVariant(fixed, 4);
    expect(selected.label).toBeUndefined();
    expect(selected.slots).toHaveLength(1);
  });

  it("throws for a template with neither slots nor variants", () => {
    expect(() => selectVariant({ ...fixed, slots: undefined }, 1)).toThrow();
  });

  it("returns the alternative the athlete chose, whatever the week", () => {
    const selected = selectVariant(chooseable, 3, "hike");
    expect(selected.label).toBe("Mountain Hike — 90 min");
    expect(selected.slots.map((entry) => entry.id)).toEqual(["hike"]);
  });

  it("stands the first alternative in when the athlete hasn't chosen", () => {
    // Previews (the dashboard, the week picker) resolve the day before there is
    // a choice to honor, so the session still reads as a concrete plan.
    expect(selectVariant(chooseable, 2).label).toBe("Row — 75 min");
  });

  it("throws when the chosen alternative isn't one the session offers", () => {
    expect(() => selectVariant(chooseable, 1, "swim")).toThrow();
  });

  it("throws when an alternative is chosen for a session offering none", () => {
    expect(() => selectVariant(rotating, 1, "row")).toThrow();
  });
});
