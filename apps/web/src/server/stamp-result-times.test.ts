import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import type { ExerciseResult } from "@titan/domain/result";
import { stampResultTimes } from "./stamp-result-times";

const result = (id: string, recordedAt?: string): ExerciseResult => ({
  exerciseId: "back-squat",
  id,
  prescription: Prescription.Strength({ reps: 5, sets: 1, weight: 100 }),
  sets: [{ completed: true, reps: 5, setIndex: 0, weight: 100 }],
  slotId: "squat",
  ...(recordedAt === undefined ? {} : { recordedAt }),
});

describe("stampResultTimes", () => {
  it("stamps a freshly logged result with the current time", () => {
    const [stamped] = stampResultTimes(
      [],
      [result("a")],
      "2026-08-11T18:05:00.000Z",
    );
    expect(stamped?.recordedAt).toBe("2026-08-11T18:05:00.000Z");
  });

  it("preserves the recorded time of a result stamped on a prior save", () => {
    const stored = [result("a", "2026-08-11T18:00:00.000Z")];
    const [stamped] = stampResultTimes(
      stored,
      [result("a")],
      "2026-08-11T18:05:00.000Z",
    );
    expect(stamped?.recordedAt).toBe("2026-08-11T18:00:00.000Z");
  });

  it("keeps earlier pieces and stamps only the newly added one", () => {
    const stored = [result("a", "2026-08-11T18:00:00.000Z")];
    const stamped = stampResultTimes(
      stored,
      [result("a"), result("b")],
      "2026-08-11T18:05:00.000Z",
    );
    expect(stamped.map((each) => each.recordedAt)).toEqual([
      "2026-08-11T18:00:00.000Z",
      "2026-08-11T18:05:00.000Z",
    ]);
  });
});
