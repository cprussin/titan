import { describe, expect, it } from "bun:test";
import { signState, verifyState } from "./oauth-state";

const secret = "a-sufficiently-long-secret";
const state = { nonce: "abc-123", origin: "https://preview.example.com" };

describe("oauth state", () => {
  it("round-trips the nonce and origin", () => {
    expect(verifyState(secret, signState(secret, state))).toEqual(state);
  });

  it("rejects state signed with a different secret", () => {
    const token = signState("secret-one-is-long-enough", state);
    expect(verifyState("secret-two-is-long-enough", token)).toBeUndefined();
  });
});
