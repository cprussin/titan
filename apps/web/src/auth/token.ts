import { z } from "zod";
import { signPayload, verifyPayload } from "./signed-payload";

/** The identity carried in a session cookie: who is signed in. Minted only
 *  after a successful Google sign-in, so the app trusts these fields for
 *  display without re-fetching Google. */
export const sessionUserSchema = z.object({
  email: z.string(),
  name: z.string(),
  picture: z.string().optional(),
});

export type SessionUser = z.infer<typeof sessionUserSchema>;

/** Mint a signed session token carrying the identity. */
export const signSession = (secret: string, user: SessionUser): string =>
  signPayload(secret, user);

/** The identity a session token carries, or `undefined` when the token is
 *  missing, malformed, or its signature doesn't match — i.e. the request is
 *  unauthenticated. */
export const verifySession = (
  secret: string,
  token: string,
): SessionUser | undefined => verifyPayload(secret, token, sessionUserSchema);
