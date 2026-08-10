import { createHmac, timingSafeEqual } from "node:crypto";
import type { ZodType } from "zod";

/**
 * A self-contained signed token: the base64url-encoded JSON payload followed by
 * an HMAC over it, keyed by the server secret. Used for every value the app
 * hands to the browser and trusts back — the session cookie, the OAuth `state`,
 * and the cross-deployment sign-in handoff.
 *
 * Verification returns the parsed payload only when the signature matches AND
 * the payload satisfies the caller's schema. The schema check matters because
 * all payload types share one secret, so a token of one shape would otherwise
 * be accepted where another is expected; a shape mismatch yields `undefined`.
 */
export const signPayload = (secret: string, payload: unknown): string => {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(secret, body)}`;
};

export const verifyPayload = <T>(
  secret: string,
  token: string,
  schema: ZodType<T>,
): T | undefined => {
  const [body, signature] = token.split(".");
  if (body === undefined || signature === undefined) {
    return undefined;
  } else {
    const expected = Buffer.from(sign(secret, body));
    const actual = Buffer.from(signature);
    if (
      expected.length === actual.length &&
      timingSafeEqual(expected, actual)
    ) {
      const parsed = schema.safeParse(
        JSON.parse(Buffer.from(body, "base64url").toString()),
      );
      return parsed.success ? parsed.data : undefined;
    } else {
      return undefined;
    }
  }
};

const sign = (secret: string, body: string): string =>
  createHmac("sha256", secret).update(body).digest("hex");
