import { describe, expect, it } from "bun:test";
import { signToken, verifyToken } from "./token";

describe("session token", () => {
  it("verifies a token minted from the same secret", () => {
    const token = signToken("a-sufficiently-long-secret");
    expect(verifyToken("a-sufficiently-long-secret", token)).toBe(true);
  });

  it("rejects a token from a different secret", () => {
    const token = signToken("secret-one-is-long-enough");
    expect(verifyToken("secret-two-is-long-enough", token)).toBe(false);
  });

  it("rejects a malformed token without throwing", () => {
    expect(verifyToken("a-sufficiently-long-secret", "nope")).toBe(false);
  });
});
