import { describe, expect, it } from "bun:test";
import { blockWeeks } from "./block-weeks";

describe("blockWeeks", () => {
  it("flags weeks before, at, and after the current week", () => {
    expect(blockWeeks(2, 4)).toEqual([
      "complete",
      "current",
      "upcoming",
      "upcoming",
    ]);
  });

  it("marks the first week current at the start of a block", () => {
    expect(blockWeeks(1, 3)).toEqual(["current", "upcoming", "upcoming"]);
  });
});
