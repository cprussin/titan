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

/** Where the production callback sends a handoff: the app's deep link, or the
 *  completion route of the web deployment that started sign-in. */
export const handoffRedirect = (origin: string, token: string): string => {
  const target =
    origin === APP_SIGN_IN_ORIGIN
      ? new URL(origin)
      : new URL("/api/auth/complete", origin);
  target.searchParams.set("token", token);
  return target.toString();
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
