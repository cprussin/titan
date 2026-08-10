import { describe, expect, it } from "bun:test";
import {
  buildAuthorizeUrl,
  exchangeCode,
  fetchUserInfo,
  GOOGLE_TOKEN_URL,
  GOOGLE_USERINFO_URL,
} from "./google";

const recording = (response: Response) => {
  const calls: Parameters<typeof globalThis.fetch>[] = [];
  const fetch: typeof globalThis.fetch = Object.assign(
    (...args: Parameters<typeof globalThis.fetch>) => {
      calls.push(args);
      return Promise.resolve(response);
    },
    { preconnect: globalThis.fetch.preconnect },
  );
  return { calls, fetch };
};

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status,
  });

describe("buildAuthorizeUrl", () => {
  it("targets Google's consent screen with the OAuth query params", () => {
    const url = buildAuthorizeUrl({
      clientId: "client-1",
      redirectUri: "https://app.example/api/auth/callback",
      state: "xyz",
    });
    expect(url).toContain("https://accounts.google.com/o/oauth2/v2/auth?");
    expect(url).toContain("client_id=client-1");
    expect(url).toContain("response_type=code");
    expect(url).toContain("scope=openid+email+profile");
    expect(url).toContain("state=xyz");
  });
});

describe("exchangeCode", () => {
  it("posts an authorization_code grant and parses the token", async () => {
    const { calls, fetch } = recording(
      jsonResponse({ access_token: "access-123", token_type: "Bearer" }),
    );
    const result = await exchangeCode(
      {
        clientId: "client-1",
        clientSecret: "secret",
        code: "the-code",
        redirectUri: "https://app.example/api/auth/callback",
      },
      fetch,
    );
    expect(result).toEqual({
      access_token: "access-123",
      token_type: "Bearer",
    });
    expect(String(calls[0]?.[0])).toBe(GOOGLE_TOKEN_URL);
    expect(String(calls[0]?.[1]?.body)).toContain(
      "grant_type=authorization_code",
    );
    expect(String(calls[0]?.[1]?.body)).toContain("code=the-code");
  });

  it("throws when the token endpoint responds non-OK", () => {
    const { fetch } = recording(jsonResponse({ error: "bad" }, 400));
    expect(
      exchangeCode(
        {
          clientId: "client-1",
          clientSecret: "secret",
          code: "the-code",
          redirectUri: "https://app.example/api/auth/callback",
        },
        fetch,
      ),
    ).rejects.toThrow();
  });
});

describe("fetchUserInfo", () => {
  it("fetches the profile with a bearer token and parses it", async () => {
    const { calls, fetch } = recording(
      jsonResponse({
        email: "athlete@example.com",
        email_verified: true,
        name: "Ada Lovelace",
        picture: "https://example.com/ada.jpg",
        sub: "12345",
      }),
    );
    const result = await fetchUserInfo("access-123", fetch);
    expect(result).toEqual({
      email: "athlete@example.com",
      email_verified: true,
      name: "Ada Lovelace",
      picture: "https://example.com/ada.jpg",
      sub: "12345",
    });
    expect(String(calls[0]?.[0])).toBe(GOOGLE_USERINFO_URL);
    expect(calls[0]?.[1]?.headers).toEqual({
      authorization: "Bearer access-123",
    });
  });

  it("throws when the userinfo endpoint responds non-OK", () => {
    const { fetch } = recording(jsonResponse({ error: "bad" }, 401));
    expect(fetchUserInfo("access-123", fetch)).rejects.toThrow();
  });
});
