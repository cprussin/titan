import { describe, expect, it } from "bun:test";
import { presentedSessionToken } from "./presented-session-token";

describe("presentedSessionToken", () => {
  it("reads a bearer token from the authorization header", () => {
    expect(presentedSessionToken(undefined, "Bearer abc.def")).toBe("abc.def");
  });

  it("prefers the bearer token over a session cookie", () => {
    expect(presentedSessionToken("cookie.sig", "Bearer abc.def")).toBe(
      "abc.def",
    );
  });

  it("falls back to the session cookie without an authorization header", () => {
    expect(presentedSessionToken("cookie.sig", undefined)).toBe("cookie.sig");
  });

  it("ignores an authorization header of another scheme", () => {
    expect(presentedSessionToken("cookie.sig", "Basic dXNlcjpwdw==")).toBe(
      "cookie.sig",
    );
  });

  it("presents nothing when neither carries a token", () => {
    expect(presentedSessionToken(undefined, undefined)).toBeUndefined();
  });
});
