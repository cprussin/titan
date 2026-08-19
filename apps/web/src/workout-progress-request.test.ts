import { describe, expect, it } from "bun:test";
import {
  WorkoutProgressRequest,
  workoutProgressRequestSchema,
} from "./workout-progress-request";

/** Strict type equality, used by the coverage harness below. */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Assert<T extends true> = T;

const sets = [{ completed: true, reps: 5, rpe: 8, setIndex: 0, weight: 100 }];

const recorded = {
  exerciseId: "back-squat",
  id: "r1",
  prescription: {
    reps: 5,
    sets: 3,
    type: "strength",
    unit: "lb",
    weight: 100,
  },
  sets,
  slotId: "slot-1",
};

describe("WorkoutProgressRequest constructors", () => {
  it("cover the schema union exactly (compile-time harness)", () => {
    const constructorsCoverUnion: Assert<
      Equals<
        ReturnType<
          (typeof WorkoutProgressRequest)[keyof typeof WorkoutProgressRequest]
        >,
        WorkoutProgressRequest
      >
    > = true;
    expect(constructorsCoverUnion).toBe(true);
  });

  it("build bodies the endpoint's parser accepts", () => {
    expect(
      [
        WorkoutProgressRequest.Sets({ sets, slotId: "slot-1" }),
        WorkoutProgressRequest.Recorded(recorded),
        WorkoutProgressRequest.Finished(recorded),
      ].map((body) => workoutProgressRequestSchema.parse(body).kind),
    ).toEqual(["sets", "recorded", "finished"]);
  });
});
