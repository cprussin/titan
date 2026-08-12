import { describe, expect, it } from "bun:test";
import { concept2ResultSchema } from "./concept2-api";

const rawResult = {
  date: "2024-01-15 08:30:00",
  distance: 2000,
  heart_rate: { average: 165, max: 182, min: 120 },
  id: 987,
  stroke_rate: 24,
  time: 4500,
  type: "rower",
  workout: {
    intervals: [{ distance: 500, stroke_rate: 25, time: 1125 }],
  },
};

describe("concept2ResultSchema", () => {
  it("parses a full result payload", () => {
    const parsed = concept2ResultSchema.parse(rawResult);
    expect(parsed.distance).toBe(2000);
    expect(parsed.time).toBe(4500);
    expect(parsed.workout?.intervals).toHaveLength(1);
  });

  it("strips heart-rate fields beyond the average", () => {
    const parsed = concept2ResultSchema.parse(rawResult);
    expect(parsed.heart_rate).toEqual({ average: 165 });
  });

  it("accepts a result with no heart rate", () => {
    const { heart_rate, ...withoutHeartRate } = rawResult;
    const parsed = concept2ResultSchema.parse(withoutHeartRate);
    expect(parsed.heart_rate).toBeUndefined();
  });

  it("accepts a workout with no intervals", () => {
    const parsed = concept2ResultSchema.parse({
      ...rawResult,
      workout: {},
    });
    expect(parsed.workout?.intervals).toBeUndefined();
  });

  it("rejects a payload missing a required field", () => {
    const { time, ...withoutTime } = rawResult;
    expect(concept2ResultSchema.safeParse(withoutTime).success).toBe(false);
  });
});
