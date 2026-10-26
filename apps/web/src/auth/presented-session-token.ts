const BEARER_PREFIX = "Bearer ";

/**
 * The session token a request presents. The Android app sends it as a bearer
 * token in the `authorization` header; the web app carries it in the session
 * cookie. A bearer token wins when both are present, since it is the one the
 * caller chose to send.
 */
export const presentedSessionToken = (
  cookieToken: string | undefined,
  authorization: string | undefined,
): string | undefined =>
  authorization?.startsWith(BEARER_PREFIX) === true
    ? authorization.slice(BEARER_PREFIX.length)
    : cookieToken;
