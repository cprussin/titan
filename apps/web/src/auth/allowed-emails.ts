/** The sign-in allowlist. Google authenticates anyone with an account, so the
 *  app additionally restricts access to a configured set of addresses — v1 is
 *  single-user (see `user.ts`), and this keeps it that way. */

const normalize = (email: string): string => email.trim().toLowerCase();

/** Parse the comma-separated `GOOGLE_ALLOWED_EMAILS` env value into normalized
 *  addresses. */
export const parseAllowedEmails = (raw: string): readonly string[] =>
  raw
    .split(",")
    .map(normalize)
    .filter((email) => email.length > 0);

/** Whether `email` is permitted to sign in. */
export const isEmailAllowed = (
  allowed: readonly string[],
  email: string,
): boolean => allowed.includes(normalize(email));
