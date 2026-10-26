import { describe, expect, it } from "bun:test";
import { wireJson } from "./wire-json";

describe("wireJson", () => {
  it("writes a map as an object keyed by its keys", () => {
    expect(wireJson({ names: new Map([["squat", "Back Squat"]]) })).toEqual({
      names: { squat: "Back Squat" },
    });
  });

  it("converts maps nested inside arrays and maps", () => {
    expect(wireJson([new Map([["outer", new Map([["inner", 1]])]])])).toEqual([
      { outer: { inner: 1 } },
    ]);
  });

  it("passes plain values through untouched", () => {
    const value = { count: 2, label: "x", list: [1, "two"], none: undefined };
    expect(wireJson(value)).toEqual(value);
  });
});
