import { describe, expect, it } from "bun:test";
import {
  buildAuthorizeUrl,
  CONCEPT2_TOKEN_URL,
  exchangeCode,
  fetchResults,
} from "./oauth";

const token = {
  access_token: "access-123",
  expires_in: 3600,
  refresh_token: "refresh-456",
  scope: "user:read,results:read",
  token_type: "Bearer",
};

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

const jsonResponse = (body: unknown): Response =>
  new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status: 200,
  });

describe("buildAuthorizeUrl", () => {
  it("targets the authorize endpoint with the OAuth query params", () => {
    const url = buildAuthorizeUrl({
      clientId: "client-1",
      redirectUri: "https://app.example/callback",
      scope: "user:read",
      state: "xyz",
    });
    expect(url).toContain("https://log.concept2.com/oauth/authorize?");
    expect(url).toContain("client_id=client-1");
    expect(url).toContain("response_type=code");
    expect(url).toContain("state=xyz");
  });
});

describe("exchangeCode", () => {
  it("posts an authorization_code grant and parses the token", async () => {
    const { calls, fetch } = recording(jsonResponse(token));
    const result = await exchangeCode(
      {
        clientId: "client-1",
        clientSecret: "secret",
        code: "the-code",
        redirectUri: "https://app.example/callback",
      },
      fetch,
    );
    expect(result).toEqual(token);
    expect(String(calls[0]?.[0])).toBe(CONCEPT2_TOKEN_URL);
    expect(String(calls[0]?.[1]?.body)).toContain(
      "grant_type=authorization_code",
    );
    expect(String(calls[0]?.[1]?.body)).toContain("code=the-code");
  });

  it("parses a token response that omits the optional scope", async () => {
    const { scope: _scope, ...withoutScope } = token;
    const { fetch } = recording(jsonResponse(withoutScope));
    const result = await exchangeCode(
      {
        clientId: "client-1",
        clientSecret: "secret",
        code: "the-code",
        redirectUri: "https://app.example/callback",
      },
      fetch,
    );
    expect(result.scope).toBeUndefined();
    expect(result.access_token).toBe("access-123");
  });

  it("throws when the token endpoint responds non-OK", () => {
    const { fetch } = recording(new Response("nope", { status: 401 }));
    expect(
      exchangeCode(
        {
          clientId: "client-1",
          clientSecret: "secret",
          code: "the-code",
          redirectUri: "https://app.example/callback",
        },
        fetch,
      ),
    ).rejects.toThrow("Concept2 token request failed: 401");
  });
});

describe("fetchResults", () => {
  it("authorizes with the bearer token and parses the result list", async () => {
    const raw = {
      date: "2024-01-15 08:30:00",
      distance: 2000,
      id: 987,
      stroke_rate: 24,
      time: 4500,
      type: "rower",
    };
    const { calls, fetch } = recording(jsonResponse({ data: [raw] }));
    const results = await fetchResults(
      { accessToken: "access-123", from: "2024-01-01" },
      fetch,
    );
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe(987);
    expect(calls[0]?.[1]?.headers).toEqual({
      authorization: "Bearer access-123",
    });
    expect(String(calls[0]?.[0])).toContain("from=2024-01-01");
  });

  it("throws when the results endpoint responds non-OK", () => {
    const { fetch } = recording(new Response("nope", { status: 500 }));
    expect(
      fetchResults({ accessToken: "access-123", from: "2024-01-01" }, fetch),
    ).rejects.toThrow("Concept2 results request failed: 500");
  });
});
