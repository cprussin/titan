import { describe, expect, it } from "bun:test";
import { signSession, verifySession } from "./token";

const secret = "a-sufficiently-long-secret";
const user = {
  email: "athlete@example.com",
  name: "Ada Lovelace",
  picture: "https://example.com/ada.jpg",
};

describe("session token", () => {
  it("round-trips the user minted from the same secret", () => {
    const token = signSession(secret, user);
    expect(verifySession(secret, token)).toEqual(user);
  });

  it("preserves a user without a picture", () => {
    const token = signSession(secret, {
      email: "no-pic@example.com",
      name: "No Picture",
    });
    expect(verifySession(secret, token)).toEqual({
      email: "no-pic@example.com",
      name: "No Picture",
    });
  });

  it("rejects a token signed with a different secret", () => {
    const token = signSession("secret-one-is-long-enough", user);
    expect(verifySession("secret-two-is-long-enough", token)).toBeUndefined();
  });

  it("rejects a token whose payload was tampered with", () => {
    const [, signature] = signSession(secret, user).split(".");
    const forged = `${Buffer.from(
      JSON.stringify({ ...user, email: "attacker@example.com" }),
    ).toString("base64url")}.${signature ?? ""}`;
    expect(verifySession(secret, forged)).toBeUndefined();
  });

  it("rejects a malformed token without throwing", () => {
    expect(verifySession(secret, "nope")).toBeUndefined();
  });
});
