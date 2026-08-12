import { describe, expect, it } from "bun:test";
import { resolveTimeZone } from "./timezone";

describe("resolveTimeZone", () => {
  it("keeps a recognized IANA zone", () => {
    expect(resolveTimeZone("America/New_York")).toBe("America/New_York");
  });

  it("falls back to UTC when the browser has not reported a zone yet", () => {
    expect(resolveTimeZone(undefined)).toBe("UTC");
  });

  it("falls back to UTC when the reported value is not a real zone", () => {
    expect(resolveTimeZone("Pluto/Cydonia")).toBe("UTC");
  });
});
