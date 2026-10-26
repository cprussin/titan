import { createHash } from "node:crypto";
import { verifyHandoff } from "./oauth-handoff";
import type { SessionUser } from "./token";

/**
 * Sign-in for the Android app. The app runs the same Google flow as the web, in
 * a browser tab, with two differences: the `state` records this origin instead
 * of a deployment's, so the production callback hands the result to the app's
 * deep link; and the flow's nonce is a PKCE-style challenge (RFC 7636 S256), so
 * only the app that started the flow — the one holding the verifier — can
 * redeem the handoff for a session token. Another app that intercepted the deep
 * link holds the handoff but not the verifier.
 */
export const APP_SIGN_IN_ORIGIN = "titan://auth";

/** The challenge the app sends to start sign-in: the base64url SHA-256 of the
 *  verifier it keeps. */
export const codeChallenge = (verifier: string): string =>
  createHash("sha256").update(verifier).digest("base64url");

/** The page that hands a sign-in result to the app. Browsers refuse a server
 *  redirect straight to a custom scheme (Brave shows ERR_FAILED), so the
 *  callback lands here on `https` and the page opens the app instead. */
export const APP_RETURN_PATH = "/api/v1/auth/app/return";

const appReturn = (proxyOrigin: string, key: string, value: string): string => {
  const target = new URL(APP_RETURN_PATH, proxyOrigin);
  target.searchParams.set(key, value);
  return target.toString();
};

/** Where the production callback sends a handoff: the app's return page, or
 *  the completion route of the web deployment that started sign-in. */
export const handoffRedirect = (
  proxyOrigin: string,
  origin: string,
  token: string,
): string => {
  if (origin === APP_SIGN_IN_ORIGIN) {
    return appReturn(proxyOrigin, "token", token);
  } else {
    const target = new URL("/api/auth/complete", origin);
    target.searchParams.set("token", token);
    return target.toString();
  }
};

/** Where the production callback sends a refused sign-in: the app's return
 *  page, or the login page of the web deployment that started sign-in. */
export const forbiddenRedirect = (
  proxyOrigin: string,
  origin: string,
): string =>
  origin === APP_SIGN_IN_ORIGIN
    ? appReturn(proxyOrigin, "error", "forbidden")
    : new URL("/login?error=forbidden", origin).toString();

const handoffTokenPattern = /^[\w.-]+$/;

/** The `intent:` link that opens the app's `titan://auth` deep link with the
 *  return page's result, or `undefined` for a malformed one. An `intent:` link
 *  names the package, so Chromium browsers open the app rather than search. */
export const appDeepLink = (params: URLSearchParams): string | undefined => {
  const query = appReturnQuery(params);
  return query === undefined
    ? undefined
    : `intent://auth?${query}#Intent;scheme=titan;package=net.prussin.titan;end`;
};

const appReturnQuery = (params: URLSearchParams): string | undefined => {
  const token = params.get("token");
  if (token !== null && handoffTokenPattern.test(token)) {
    return `token=${token}`;
  } else if (params.get("error") === "forbidden") {
    return "error=forbidden";
  } else {
    return undefined;
  }
};

/** The user an app handoff signs in, when it is unexpired and its challenge is
 *  the presented verifier's; otherwise `undefined`. */
export const redeemAppHandoff = (
  secret: string,
  token: string,
  verifier: string,
  now: number,
): SessionUser | undefined => {
  const handoff = verifyHandoff(secret, token, now);
  return handoff !== undefined && handoff.nonce === codeChallenge(verifier)
    ? handoff.user
    : undefined;
};
