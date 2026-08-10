import { z } from "zod";

/**
 * A thin Google OAuth2 / OpenID Connect client: build the consent-screen URL,
 * trade an authorization code for tokens, and fetch the signed-in user's
 * profile. Every function that touches the network takes an injected `fetch`
 * defaulting to the platform global, so tests pass a stub instead of mocking
 * the module (see TESTING.md). JSON responses are parsed with Zod at the
 * boundary, and a non-OK response throws with the status attached rather than
 * returning a partial value (see ERRORS.md).
 */

export const GOOGLE_AUTHORIZE_URL =
  "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_USERINFO_URL =
  "https://openidconnect.googleapis.com/v1/userinfo";

/** The OpenID scopes we request: enough to identify the athlete for display. */
const SCOPE = "openid email profile";

const tokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
});

export type GoogleToken = z.infer<typeof tokenResponseSchema>;

const userInfoSchema = z.object({
  email: z.string(),
  email_verified: z.boolean(),
  name: z.string(),
  picture: z.string().optional(),
  sub: z.string(),
});

export type GoogleUserInfo = z.infer<typeof userInfoSchema>;

export type AuthorizeUrlParams = {
  clientId: string;
  redirectUri: string;
  state: string;
};

export const buildAuthorizeUrl = ({
  clientId,
  redirectUri,
  state,
}: AuthorizeUrlParams): string => {
  const url = new URL(GOOGLE_AUTHORIZE_URL);
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
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

export const exchangeCode = async (
  { clientId, clientSecret, code, redirectUri }: ExchangeCodeParams,
  fetch: typeof globalThis.fetch = globalThis.fetch,
): Promise<GoogleToken> => {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
  });
  if (response.ok) {
    return tokenResponseSchema.parse(await response.json());
  } else {
    throw new Error(
      `Google token request failed: ${response.status} ${response.statusText}`,
    );
  }
};

export const fetchUserInfo = async (
  accessToken: string,
  fetch: typeof globalThis.fetch = globalThis.fetch,
): Promise<GoogleUserInfo> => {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (response.ok) {
    return userInfoSchema.parse(await response.json());
  } else {
    throw new Error(
      `Google userinfo request failed: ${response.status} ${response.statusText}`,
    );
  }
};
