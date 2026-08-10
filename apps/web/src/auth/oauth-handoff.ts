import { z } from "zod";
import { signPayload, verifyPayload } from "./signed-payload";
import type { SessionUser } from "./token";
import { sessionUserSchema } from "./token";

/** The signed, short-lived credential the production callback issues to deliver
 *  an authenticated identity back to the deployment that started sign-in. It's
 *  bound to the flow's `nonce` (matched against a cookie on the target origin)
 *  and expires quickly, so a leaked handoff URL is neither replayable in
 *  another browser nor usable for long. */
export type Handoff = {
  nonce: string;
  user: SessionUser;
};

const DEFAULT_TTL_MS = 60_000;

const handoffSchema = z.object({
  exp: z.number(),
  nonce: z.string(),
  user: sessionUserSchema,
});

export const signHandoff = (
  secret: string,
  handoff: Handoff,
  now: number,
  ttlMs: number = DEFAULT_TTL_MS,
): string =>
  signPayload(secret, {
    exp: now + ttlMs,
    nonce: handoff.nonce,
    user: handoff.user,
  });

export const verifyHandoff = (
  secret: string,
  token: string,
  now: number,
): Handoff | undefined => {
  const parsed = verifyPayload(secret, token, handoffSchema);
  if (parsed !== undefined && parsed.exp > now) {
    return { nonce: parsed.nonce, user: parsed.user };
  } else {
    return undefined;
  }
};
