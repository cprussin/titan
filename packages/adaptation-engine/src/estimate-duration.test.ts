import { describe, expect, it } from "bun:test";
import { Prescription } from "@titan/domain/prescription";
import { estimatePrescriptionMinutes } from "./estimate-duration";

describe("estimatePrescriptionMinutes", () => {
  it("budgets band work by its working sets", () => {
    expect(
      estimatePrescriptionMinutes(Prescription.Band({ reps: 10, sets: 3 })),
    ).toBe(7.5);
  });

  it("budgets a timed carry by its working sets", () => {
    expect(
      estimatePrescriptionMinutes(
        Prescription.TimedCarry({ durationSec: 40, sets: 3, weight: 150 }),
      ),
    ).toBe(7.5);
  });
});
