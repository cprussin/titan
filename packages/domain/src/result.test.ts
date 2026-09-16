import { describe, expect, it } from "bun:test";
import { setResultSchema } from "./result";

describe("setResultSchema", () => {
  it("records the bands a set was worked against, stacked", () => {
    const set = setResultSchema.parse({
      bands: ["green", "red"],
      completed: true,
      reps: 10,
      setIndex: 0,
    });
    expect(set.bands).toEqual(["green", "red"]);
  });

  it("parses a set that recorded no bands", () => {
    expect(
      setResultSchema.parse({ completed: true, reps: 10, setIndex: 0 }).bands,
    ).toBeUndefined();
  });

  it("rejects a band outside the set the athlete owns", () => {
    expect(
      setResultSchema.safeParse({
        bands: ["chartreuse"],
        completed: true,
        reps: 10,
        setIndex: 0,
      }).success,
    ).toBe(false);
  });
});
