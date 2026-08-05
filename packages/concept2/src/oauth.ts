import { z } from "zod";
import type { Concept2Result } from "./concept2-api";
import { concept2ResultsResponseSchema } from "./concept2-api";

/**
 * A thin Concept2 Logbook OAuth2 client: build the authorize URL, trade an
 * authorization code (or a refresh token) for tokens, and fetch logged results.
 * Every function that touches the network takes an injected `fetch` defaulting
 * to the platform global, so tests pass a stub instead of mocking the module
 * (see TESTING.md). All JSON responses are parsed with Zod at the boundary, and
 * a non-OK response throws with the status attached rather than returning a
 * partial value (see ERRORS.md).
 */

export const CONCEPT2_AUTHORIZE_URL =
  "https://log.concept2.com/oauth/authorize";
export const CONCEPT2_TOKEN_URL = "https://log.concept2.com/oauth/access_token";
export const CONCEPT2_API_BASE = "https://log.concept2.com/api";

const tokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  refresh_token: z.string(),
  scope: z.string(),
  token_type: z.string(),
});

export type Concept2Token = z.infer<typeof tokenResponseSchema>;

export type AuthorizeUrlParams = {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
};

export const buildAuthorizeUrl = ({
  clientId,
  redirectUri,
  scope,
  state,
}: AuthorizeUrlParams): string => {
  const url = new URL(CONCEPT2_AUTHORIZE_URL);
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    state,
  }).toString();
  return url.toString();
};

export type ExchangeCodeParams = {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
};

export const exchangeCode = (
  { clientId, clientSecret, code, redirectUri }: ExchangeCodeParams,
  fetch: typeof globalThis.fetch = globalThis.fetch,
): Promise<Concept2Token> =>
  requestToken(
    {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    },
    fetch,
  );

export type RefreshTokenParams = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
};

export const refreshToken = (
  { clientId, clientSecret, refreshToken: token }: RefreshTokenParams,
  fetch: typeof globalThis.fetch = globalThis.fetch,
): Promise<Concept2Token> =>
  requestToken(
    {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: token,
    },
    fetch,
  );

export type FetchResultsParams = {
  accessToken: string;
  from: string;
};

export const fetchResults = async (
  { accessToken, from }: FetchResultsParams,
  fetch: typeof globalThis.fetch = globalThis.fetch,
): Promise<readonly Concept2Result[]> => {
  const url = new URL(`${CONCEPT2_API_BASE}/users/me/results`);
  url.searchParams.set("from", from);
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (response.ok) {
    return concept2ResultsResponseSchema.parse(await response.json()).data;
  } else {
    throw new Error(
      `Concept2 results request failed: ${response.status} ${response.statusText}`,
    );
  }
};

const requestToken = async (
  body: Record<string, string>,
  fetch: typeof globalThis.fetch,
): Promise<Concept2Token> => {
  const response = await fetch(CONCEPT2_TOKEN_URL, {
    body: new URLSearchParams(body),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
  });
  if (response.ok) {
    return tokenResponseSchema.parse(await response.json());
  } else {
    throw new Error(
      `Concept2 token request failed: ${response.status} ${response.statusText}`,
    );
  }
};
