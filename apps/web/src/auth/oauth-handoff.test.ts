import { describe, expect, it } from "bun:test";
import { signHandoff, verifyHandoff } from "./oauth-handoff";

const secret = "a-sufficiently-long-secret";
const handoff = {
  nonce: "abc-123",
  user: { email: "athlete@example.com", name: "Ada Lovelace" },
};

describe("oauth handoff", () => {
  it("round-trips the user and nonce while unexpired", () => {
    const token = signHandoff(secret, handoff, 1000);
    expect(verifyHandoff(secret, token, 1000 + 30_000)).toEqual(handoff);
  });

  it("rejects a handoff past its expiry", () => {
    const token = signHandoff(secret, handoff, 1000, 60_000);
    expect(verifyHandoff(secret, token, 1000 + 60_001)).toBeUndefined();
  });

  it("rejects a handoff signed with a different secret", () => {
    const token = signHandoff("secret-one-is-long-enough", handoff, 1000);
    expect(
      verifyHandoff("secret-two-is-long-enough", token, 1000),
    ).toBeUndefined();
  });
});
