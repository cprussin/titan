import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time check that a webhook call carried the configured shared secret.
 * Returns false whenever either side is absent (an unconfigured secret never
 * authenticates) or the lengths differ, and otherwise compares in constant time
 * so the endpoint doesn't leak the secret through response timing.
 */
export const isValidWebhookSecret = (
  provided: string | undefined,
  expected: string | undefined,
): boolean => {
  if (provided === undefined || expected === undefined) {
    return false;
  } else {
    const providedBytes = Buffer.from(provided);
    const expectedBytes = Buffer.from(expected);
    return (
      providedBytes.length === expectedBytes.length &&
      timingSafeEqual(providedBytes, expectedBytes)
    );
  }
};
