import { z } from "zod";
import { signPayload, verifyPayload } from "./signed-payload";

/** The signed value round-tripped through Google's `state` parameter. It
 *  carries a CSRF `nonce` and the `origin` of the deployment that started the
 *  sign-in, so the production callback knows where to send the athlete back —
 *  the mechanism that lets preview deployments authenticate through a single
 *  registered redirect URI. */
export const oauthStateSchema = z.object({
  nonce: z.string(),
  origin: z.string(),
});

export type OAuthState = z.infer<typeof oauthStateSchema>;

export const signState = (secret: string, state: OAuthState): string =>
  signPayload(secret, state);

export const verifyState = (
  secret: string,
  token: string,
): OAuthState | undefined => verifyPayload(secret, token, oauthStateSchema);
