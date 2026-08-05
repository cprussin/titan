import { createHmac, timingSafeEqual } from "node:crypto";

/** The signed payload backing a session. Single-user auth: possession of a valid
 *  HMAC over this constant (keyed by the server secret) proves the password was
 *  entered. Bump the suffix to invalidate all sessions. */
const SESSION_MESSAGE = "titan-authenticated:v1";

/** Mint the session token for a server secret. */
export const signToken = (secret: string): string =>
  createHmac("sha256", secret).update(SESSION_MESSAGE).digest("hex");

/** Constant-time check that `token` is the valid session token for `secret`. */
export const verifyToken = (secret: string, token: string): boolean => {
  const expected = Buffer.from(signToken(secret));
  const actual = Buffer.from(token);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
};
