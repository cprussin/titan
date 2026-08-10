/** The public origin the current request arrived on. Behind Vercel's proxy the
 *  real host is in `x-forwarded-host` (the request URL carries an internal
 *  host), so prefer that; fall back to the request URL for local development
 *  where there's no proxy. This origin is what the sign-in flow records so the
 *  athlete is returned to the deployment they started from. */
export const requestOrigin = (request: Request): string => {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost === null) {
    return new URL(request.url).origin;
  } else {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${forwardedHost}`;
  }
};
