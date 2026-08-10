import { describe, expect, it } from "bun:test";
import {
  barWeight,
  kgToLb,
  lbToKg,
  loadStep,
  modalityLoadUnit,
} from "./load-unit";

describe("modalityLoadUnit", () => {
  it("loads barbell work in kilograms", () => {
    expect(modalityLoadUnit("barbell")).toBe("kg");
  });

  it("loads everything else in pounds", () => {
    expect(modalityLoadUnit("dumbbell")).toBe("lb");
    expect(modalityLoadUnit("machine")).toBe("lb");
    expect(modalityLoadUnit("bodyweight")).toBe("lb");
  });
});

describe("lbToKg / kgToLb", () => {
  it("converts pounds to kilograms", () => {
    expect(lbToKg(100)).toBeCloseTo(45.359_237, 5);
  });

  it("round-trips a load back to itself", () => {
    expect(kgToLb(lbToKg(225))).toBeCloseTo(225, 9);
  });
});

describe("loadStep / barWeight", () => {
  it("uses metric plate math for kilograms", () => {
    expect(loadStep("kg")).toBe(2.5);
    expect(barWeight("kg")).toBe(20);
  });

  it("uses imperial plate math for pounds", () => {
    expect(loadStep("lb")).toBe(5);
    expect(barWeight("lb")).toBe(45);
  });
});
