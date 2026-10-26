import { describe, expect, it } from "bun:test";
import {
  APP_SIGN_IN_ORIGIN,
  appDeepLink,
  codeChallenge,
  forbiddenRedirect,
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

const proxy = "https://titan.example.com";

describe("handoffRedirect", () => {
  it("returns a web deployment to its completion route", () => {
    expect(handoffRedirect(proxy, "https://preview.example.com", "tok")).toBe(
      "https://preview.example.com/api/auth/complete?token=tok",
    );
  });

  it("returns the Android app through its https return page", () => {
    expect(handoffRedirect(proxy, APP_SIGN_IN_ORIGIN, "tok")).toBe(
      "https://titan.example.com/api/v1/auth/app/return?token=tok",
    );
  });
});

describe("forbiddenRedirect", () => {
  it("returns a web deployment to its login page", () => {
    expect(forbiddenRedirect(proxy, "https://preview.example.com")).toBe(
      "https://preview.example.com/login?error=forbidden",
    );
  });

  it("returns the Android app through its https return page", () => {
    expect(forbiddenRedirect(proxy, APP_SIGN_IN_ORIGIN)).toBe(
      "https://titan.example.com/api/v1/auth/app/return?error=forbidden",
    );
  });
});

describe("appDeepLink", () => {
  const link = (query: string) => appDeepLink(new URLSearchParams(query));

  it("opens the app's deep link with the handoff", () => {
    expect(link("token=eyJh.b-c_d")).toBe(
      "intent://auth?token=eyJh.b-c_d#Intent;scheme=titan;package=net.prussin.titan;end",
    );
  });

  it("opens the app's deep link with a refusal", () => {
    expect(link("error=forbidden")).toBe(
      "intent://auth?error=forbidden#Intent;scheme=titan;package=net.prussin.titan;end",
    );
  });

  it("refuses anything else", () => {
    expect(link("token=%22%3E%3Cscript%3E")).toBeUndefined();
    expect(link("error=other")).toBeUndefined();
    expect(link("")).toBeUndefined();
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
