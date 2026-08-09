import { describe, expect, it } from "bun:test";
import { isActiveNavSection } from "./active-nav-section";

describe("isActiveNavSection", () => {
  it("lights Dashboard only on the exact root path", () => {
    expect(isActiveNavSection("/", "/")).toBe(true);
    expect(isActiveNavSection("/", "/programs")).toBe(false);
    expect(isActiveNavSection("/", "/history")).toBe(false);
  });

  it("lights a section for any path under its prefix", () => {
    expect(isActiveNavSection("/programs", "/programs")).toBe(true);
    expect(isActiveNavSection("/programs", "/programs/v1/block/b1")).toBe(true);
    expect(isActiveNavSection("/history", "/history")).toBe(true);
  });

  it("lights History for a completed workout's recap", () => {
    expect(isActiveNavSection("/history", "/workout/abc/complete")).toBe(true);
  });

  it("lights no section for the in-progress workout", () => {
    expect(isActiveNavSection("/history", "/workout/abc")).toBe(false);
    expect(isActiveNavSection("/", "/workout/abc")).toBe(false);
    expect(isActiveNavSection("/programs", "/workout/abc")).toBe(false);
  });
});
