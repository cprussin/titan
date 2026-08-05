import { describe, expect, it } from "bun:test";
import {
  ProgressionPolicy,
  progressionPolicySchema,
} from "./progression-policy";

/** Strict type equality, used by the coverage harness below. */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Assert<T extends true> = T;

describe("ProgressionPolicy constructors", () => {
  it("cover the schema union exactly (compile-time harness)", () => {
    const constructorsCoverUnion: Assert<
      Equals<
        ReturnType<(typeof ProgressionPolicy)[keyof typeof ProgressionPolicy]>,
        ProgressionPolicy
      >
    > = true;
    expect(constructorsCoverUnion).toBe(true);
  });
});

describe("progressionPolicySchema", () => {
  it("parses a linear 5×5 policy", () => {
    const value = ProgressionPolicy.Linear({
      incrementLb: 5,
      missesBeforeDeload: 2,
      reps: 5,
      retainOnDeload: 0.9,
      rpeCap: 8.5,
      sets: 5,
    });
    expect(progressionPolicySchema.parse(value)).toEqual(value);
  });

  it("parses a zone-2 policy", () => {
    const value = ProgressionPolicy.Zone2({
      durationIncrementSec: 300,
      maxDurationSec: 3600,
      startDurationSec: 2700,
    });
    expect(progressionPolicySchema.parse(value)).toEqual(value);
  });

  it("rejects a linear policy with retainOnDeload above 1", () => {
    expect(
      progressionPolicySchema.safeParse({
        incrementLb: 5,
        kind: "linear",
        missesBeforeDeload: 2,
        reps: 5,
        retainOnDeload: 1.5,
        rpeCap: 8.5,
        sets: 5,
      }).success,
    ).toBe(false);
  });
});
