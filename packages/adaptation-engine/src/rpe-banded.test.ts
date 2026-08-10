import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import { ProgressionPolicy } from "@titan/domain/progression-policy";
import type { ExerciseResult } from "@titan/domain/result";
import { progressRpeBanded } from "./rpe-banded";

const policy = ProgressionPolicy.RpeBanded({
  bands: [
    { increment: 10, maxRpe: 6 },
    { increment: 5, maxRpe: 8 },
  ],
  reps: 5,
  sets: 3,
});

const base = Prescription.Strength({ reps: 5, sets: 3, weight: 135 });

/** RPE for a set: earlier sets log an easy 5 so tests can prove the policy
 *  reads the *final* working set, not the average; the final set (index 2) logs
 *  `finalRpe` when one is given, and nothing when it isn't. */
const rpeForSet = (
  setIndex: number,
  finalRpe: number | undefined,
): number | undefined => {
  switch (setIndex) {
    case 2: {
      return finalRpe;
    }
    default: {
      return 5;
    }
  }
};

/** A recorded session at `weight`. `reps` below the target marks a miss. */
const session = (
  weight: number,
  opts: { finalRpe?: number; reps?: number },
): ExerciseResult => ({
  exerciseId: "back-squat",
  id: `r-${weight}-${opts.finalRpe ?? "na"}`,
  prescription: Prescription.Strength({ reps: 5, sets: 3, weight }),
  sets: Array.from({ length: 3 }, (_, setIndex) => {
    const rpe = rpeForSet(setIndex, opts.finalRpe);
    return {
      completed: (opts.reps ?? 5) >= 5,
      reps: opts.reps ?? 5,
      setIndex,
      ...(rpe === undefined ? {} : { rpe }),
    };
  }),
  slotId: "slot-squat",
});

describe("progressRpeBanded", () => {
  it("holds the base weight with no history", () => {
    const outcome = progressRpeBanded(policy, base, []);
    expect(outcome.action).toBe("maintain");
    expect(outcome.prescription).toEqual(base);
  });

  it("adds the low-RPE band increment off the last weight", () => {
    const outcome = progressRpeBanded(policy, base, [
      session(155, { finalRpe: 5 }),
    ]);
    expect(outcome.action).toBe("increase-load");
    expect(outcome.prescription).toMatchObject({
      type: "strength",
      weight: 165,
    });
    expect(outcome.explanation).toContain("155 lb to 165 lb");
  });

  it("adds the tighter band increment when the final-set RPE is higher", () => {
    const outcome = progressRpeBanded(policy, base, [
      session(155, { finalRpe: 7.5 }),
    ]);
    expect(outcome.action).toBe("increase-load");
    expect(outcome.prescription).toMatchObject({ weight: 160 });
  });

  it("judges by the final working set, not the average", () => {
    // Early sets logged an easy RPE 5; only the final set was a grind at 8.5.
    const outcome = progressRpeBanded(policy, base, [
      session(155, { finalRpe: 8.5 }),
    ]);
    expect(outcome.action).toBe("repeat");
    expect(outcome.prescription).toMatchObject({ weight: 155 });
  });

  it("repeats when reps were missed regardless of RPE", () => {
    const outcome = progressRpeBanded(policy, base, [
      session(155, { finalRpe: 5, reps: 3 }),
    ]);
    expect(outcome.action).toBe("repeat");
    expect(outcome.prescription).toMatchObject({ weight: 155 });
  });

  it("holds when reps were met but no final-set RPE was recorded", () => {
    const outcome = progressRpeBanded(policy, base, [session(155, {})]);
    expect(outcome.action).toBe("repeat");
    expect(outcome.prescription).toMatchObject({ weight: 155 });
    expect(outcome.explanation).toContain("RPE");
  });

  it("carries the prescribed sets and reps onto the next prescription", () => {
    const outcome = progressRpeBanded(policy, base, [
      session(155, { finalRpe: 5 }),
    ]);
    expect(outcome.prescription).toMatchObject({ reps: 5, sets: 3 });
  });

  it("throws when the base is not a strength movement", () => {
    expect(() =>
      progressRpeBanded(
        policy,
        Prescription.Bodyweight({ reps: 5, sets: 3 }),
        [],
      ),
    ).toThrow();
  });
});
