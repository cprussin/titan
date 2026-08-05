import { describe, expect, it } from "bun:test";
import type { ProgramVersion } from "@titan/domain/program";
import {
  rescheduleMissed,
  resolvePosition,
  respectsConstraints,
} from "./schedule";

const programVersion: ProgramVersion = {
  blocks: [
    {
      deloadEveryWeeks: 4,
      durationWeeks: 8,
      id: "foundation",
      name: "Foundation",
      weekTemplate: {
        days: [
          { dayOfWeek: 1, sessionTemplateId: "heavy-lower" },
          { dayOfWeek: 2, sessionTemplateId: "row-intervals" },
        ],
      },
    },
    {
      durationWeeks: 6,
      id: "power",
      name: "Strength & Power",
      weekTemplate: {
        days: [{ dayOfWeek: 1, sessionTemplateId: "heavy-lower" }],
      },
    },
  ],
  createdAt: "2026-01-01T00:00:00.000Z",
  id: "pv-1",
  programId: "p-1",
  sessionTemplates: [],
  version: 1,
};

describe("resolvePosition", () => {
  it("maps an absolute week into the first block", () => {
    const position = resolvePosition(programVersion, 2, 1);
    expect(position?.block.id).toBe("foundation");
    expect(position?.weekInBlock).toBe(2);
    expect(position?.sessionTemplateId).toBe("heavy-lower");
  });

  it("crosses into the second block once the first is exhausted", () => {
    const position = resolvePosition(programVersion, 9, 1);
    expect(position?.block.id).toBe("power");
    expect(position?.weekInBlock).toBe(1);
  });

  it("flags the deload week of a block", () => {
    expect(resolvePosition(programVersion, 4, 1)?.isDeloadWeek).toBe(true);
    expect(resolvePosition(programVersion, 3, 1)?.isDeloadWeek).toBe(false);
  });

  it("returns a rest day when no session is scheduled", () => {
    expect(
      resolvePosition(programVersion, 1, 5)?.sessionTemplateId,
    ).toBeUndefined();
  });

  it("returns undefined past the end of the program", () => {
    expect(resolvePosition(programVersion, 15, 1)).toBeUndefined();
  });
});

describe("respectsConstraints", () => {
  it("rejects days outside the allowed window", () => {
    expect(respectsConstraints({ allowedDays: [1, 2, 3] }, 5, [])).toBe(false);
    expect(respectsConstraints({ allowedDays: [1, 2, 3] }, 2, [])).toBe(true);
  });

  it("rejects a day whose previous day carries an avoided tag", () => {
    const constraints = { avoidPreviousDayTags: ["hard-row", "heavy-lower"] };
    expect(respectsConstraints(constraints, 3, ["heavy-lower"])).toBe(false);
    expect(respectsConstraints(constraints, 3, ["recovery"])).toBe(true);
  });
});

describe("rescheduleMissed", () => {
  it("finds the next available allowed day", () => {
    const next = rescheduleMissed(
      { allowedDays: [1, 2, 3, 4] },
      2,
      (day) => day !== 3,
    );
    expect(next).toBe(4);
  });

  it("returns undefined when no later day works this week", () => {
    const next = rescheduleMissed({ allowedDays: [1, 2] }, 2, () => true);
    expect(next).toBeUndefined();
  });
});
