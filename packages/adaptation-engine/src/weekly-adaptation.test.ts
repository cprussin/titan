import { describe, expect, it } from "bun:test";
import { evaluateWeek } from "./weekly-adaptation";

describe("evaluateWeek", () => {
  it("triggers a scheduled deload on the final week of the cycle", () => {
    const note = evaluateWeek({
      cardioProgressed: true,
      completionPct: 1,
      deloadEveryWeeks: 4,
      strengthProgressed: true,
      weeksSinceDeload: 3,
    });
    expect(note.action).toBe("trigger-deload");
  });

  it("repeats the week when completion is low", () => {
    const note = evaluateWeek({
      cardioProgressed: false,
      completionPct: 0.4,
      strengthProgressed: false,
      weeksSinceDeload: 1,
    });
    expect(note.action).toBe("repeat-week");
  });

  it("recommends reduced volume when average RPE is very high", () => {
    const note = evaluateWeek({
      avgRpe: 9.4,
      cardioProgressed: true,
      completionPct: 0.9,
      strengthProgressed: true,
      weeksSinceDeload: 1,
    });
    expect(note.action).toBe("reduce-volume");
  });

  it("advances on a strong, sustainable week", () => {
    const note = evaluateWeek({
      avgRpe: 7.5,
      cardioProgressed: true,
      completionPct: 1,
      strengthProgressed: true,
      weeksSinceDeload: 1,
    });
    expect(note.action).toBe("advance-week");
  });
});
