import { describe, expect, it } from "bun:test";
import { isEmailAllowed, parseAllowedEmails } from "./allowed-emails";

describe("parseAllowedEmails", () => {
  it("splits, trims, and lower-cases a comma-separated list", () => {
    expect(parseAllowedEmails(" Ada@Example.com , bob@example.com ")).toEqual([
      "ada@example.com",
      "bob@example.com",
    ]);
  });

  it("drops empty entries", () => {
    expect(parseAllowedEmails("ada@example.com,, ,")).toEqual([
      "ada@example.com",
    ]);
  });
});

describe("isEmailAllowed", () => {
  const allowed = parseAllowedEmails("ada@example.com,bob@example.com");

  it("accepts a listed email regardless of case or surrounding space", () => {
    expect(isEmailAllowed(allowed, " Ada@Example.com ")).toBe(true);
  });

  it("rejects an unlisted email", () => {
    expect(isEmailAllowed(allowed, "eve@example.com")).toBe(false);
  });
});
