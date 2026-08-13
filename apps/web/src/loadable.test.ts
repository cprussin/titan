import { describe, expect, it } from "bun:test";
import { mapLoadable } from "./loadable";

describe(mapLoadable, () => {
  it("selects a slice of a resolved value", () => {
    expect(
      mapLoadable(
        { isLoading: false, value: { count: 3, name: "squat" } },
        (v) => v.name,
      ),
    ).toStrictEqual({ isLoading: false, value: "squat" });
  });

  it("passes the loading state through untouched", () => {
    expect(
      mapLoadable({ isLoading: true }, (v: { name: string }) => v.name),
    ).toStrictEqual({
      isLoading: true,
    });
  });
});
