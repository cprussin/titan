/** Guards which deployment origins may receive an authenticated session
 *  handoff. The production origin — where Google's single redirect URI is
 *  registered — is always allowed. Preview deployments are allowed only when a
 *  host suffix is configured and the origin is an `https` URL whose host ends
 *  with it, scoping handoffs to the project's own preview domains. */
export const isOriginAllowed = (
  proxyOrigin: string,
  previewHostSuffix: string | undefined,
  origin: string,
): boolean => {
  if (origin === proxyOrigin) {
    return true;
  } else if (previewHostSuffix === undefined) {
    return false;
  } else {
    return matchesPreviewHost(previewHostSuffix, origin);
  }
};

const matchesPreviewHost = (suffix: string, origin: string): boolean => {
  if (URL.canParse(origin)) {
    const url = new URL(origin);
    return url.protocol === "https:" && url.host.endsWith(suffix);
  } else {
    return false;
  }
};
