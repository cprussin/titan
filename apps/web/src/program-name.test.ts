import { describe, expect, it } from "bun:test";
import type { Program } from "@titan/domain/program";
import { programName } from "./program-name";

const program = (id: string, name: string): Program => ({
  description: "",
  goals: [],
  id,
  name,
});

describe("programName", () => {
  it("returns the display name of the program matching the id", () => {
    const programs = [
      program("a", "Foundation"),
      program("b", "Peak Strength"),
    ];
    expect(programName(programs, "b")).toBe("Peak Strength");
  });

  it("throws when no program matches the id", () => {
    expect(() => programName([program("a", "Foundation")], "b")).toThrow(
      "no program found for id b",
    );
  });
});
