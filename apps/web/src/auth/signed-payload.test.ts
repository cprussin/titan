import { describe, expect, it } from "bun:test";
import { z } from "zod";
import { signPayload, verifyPayload } from "./signed-payload";

const schema = z.object({ id: z.string(), n: z.number() });
const secret = "a-sufficiently-long-secret";

describe("signed payload", () => {
  it("round-trips a payload signed with the same secret", () => {
    const token = signPayload(secret, { id: "x", n: 1 });
    expect(verifyPayload(secret, token, schema)).toEqual({ id: "x", n: 1 });
  });

  it("rejects a payload signed with a different secret", () => {
    const token = signPayload("secret-one-is-long-enough", { id: "x", n: 1 });
    expect(
      verifyPayload("secret-two-is-long-enough", token, schema),
    ).toBeUndefined();
  });

  it("rejects a tampered payload", () => {
    const [, signature] = signPayload(secret, { id: "x", n: 1 }).split(".");
    const forged = `${Buffer.from(JSON.stringify({ id: "y", n: 1 })).toString(
      "base64url",
    )}.${signature ?? ""}`;
    expect(verifyPayload(secret, forged, schema)).toBeUndefined();
  });

  it("rejects a malformed token without throwing", () => {
    expect(verifyPayload(secret, "nope", schema)).toBeUndefined();
  });

  it("rejects a validly-signed payload that doesn't match the schema", () => {
    // Different payload types are signed with the same secret, so a token of
    // one shape must not be accepted where another is expected.
    const token = signPayload(secret, { other: "shape" });
    expect(verifyPayload(secret, token, schema)).toBeUndefined();
  });
});
