import { describe, expect, it } from "bun:test";
import {
  APP_SIGN_IN_ORIGIN,
  codeChallenge,
  handoffRedirect,
  redeemAppHandoff,
} from "./app-sign-in";
import { signHandoff } from "./oauth-handoff";

const secret = "a-sufficiently-long-secret";
const user = { email: "athlete@example.com", name: "Ada Lovelace" };
const verifier = "a-random-verifier-the-app-keeps-to-itself";

describe("codeChallenge", () => {
  it("is the base64url SHA-256 of the verifier (RFC 7636 S256)", () => {
    expect(codeChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    );
  });
});

describe("handoffRedirect", () => {
  it("returns a web deployment to its completion route", () => {
    expect(handoffRedirect("https://titan.example.com", "tok")).toBe(
      "https://titan.example.com/api/auth/complete?token=tok",
    );
  });

  it("returns the Android app to its sign-in deep link", () => {
    expect(handoffRedirect(APP_SIGN_IN_ORIGIN, "tok")).toBe(
      "titan://auth?token=tok",
    );
  });
});

describe("redeemAppHandoff", () => {
  const handoff = signHandoff(
    secret,
    { nonce: codeChallenge(verifier), user },
    1000,
  );

  it("yields the signed-in user for the verifier the flow began with", () => {
    expect(redeemAppHandoff(secret, handoff, verifier, 2000)).toEqual(user);
  });

  it("refuses a verifier that does not match the challenge", () => {
    expect(
      redeemAppHandoff(secret, handoff, "someone-elses-verifier", 2000),
    ).toBeUndefined();
  });

  it("refuses an expired handoff", () => {
    expect(
      redeemAppHandoff(secret, handoff, verifier, 1000 + 120_000),
    ).toBeUndefined();
  });
});
