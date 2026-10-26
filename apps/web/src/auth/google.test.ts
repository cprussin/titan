import { describe, expect, it } from "bun:test";
import {
  buildAuthorizeUrl,
  exchangeCode,
  fetchUserInfo,
  GOOGLE_TOKEN_URL,
  GOOGLE_TOKENINFO_URL,
  GOOGLE_USERINFO_URL,
  verifyIdToken,
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

describe("verifyIdToken", () => {
  const claims = {
    aud: "client-1",
    email: "athlete@example.com",
    email_verified: "true",
    exp: "1793000000",
    iss: "https://accounts.google.com",
    name: "Ada Lovelace",
    picture: "https://example.com/ada.jpg",
    sub: "12345",
  };

  it("asks Google to check the ID token and returns its profile", async () => {
    const { calls, fetch } = recording(jsonResponse(claims));
    expect(await verifyIdToken("id-123", "client-1", fetch)).toEqual({
      email: "athlete@example.com",
      email_verified: true,
      name: "Ada Lovelace",
      picture: "https://example.com/ada.jpg",
      sub: "12345",
    });
    expect(String(calls[0]?.[0])).toBe(
      `${GOOGLE_TOKENINFO_URL}?id_token=id-123`,
    );
  });

  it("refuses a token issued to another client", async () => {
    const { fetch } = recording(jsonResponse({ ...claims, aud: "other" }));
    expect(await verifyIdToken("id-123", "client-1", fetch)).toBeUndefined();
  });

  it("refuses a token from another issuer", async () => {
    const { fetch } = recording(
      jsonResponse({ ...claims, iss: "https://evil.example" }),
    );
    expect(await verifyIdToken("id-123", "client-1", fetch)).toBeUndefined();
  });

  it("refuses a token Google rejects", async () => {
    const { fetch } = recording(jsonResponse({ error: "invalid_token" }, 400));
    expect(await verifyIdToken("id-123", "client-1", fetch)).toBeUndefined();
  });

  it("throws when Google is unavailable", () => {
    const { fetch } = recording(jsonResponse({}, 503));
    expect(verifyIdToken("id-123", "client-1", fetch)).rejects.toThrow();
  });

  it("reads an unverified email as unverified", async () => {
    const { fetch } = recording(
      jsonResponse({ ...claims, email_verified: "false" }),
    );
    expect(
      (await verifyIdToken("id-123", "client-1", fetch))?.email_verified,
    ).toBe(false);
  });
});
