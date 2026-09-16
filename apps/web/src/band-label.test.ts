import { describe, expect, it } from "bun:test";
import { bandLabel } from "./band-label";

describe("bandLabel", () => {
  it("names a single band by its colour", () => {
    expect(bandLabel(["purple"])).toBe("Purple");
  });

  it("joins stacked bands in the order they are worn", () => {
    expect(bandLabel(["green", "purple", "red"])).toBe("Green + Purple + Red");
  });
});
