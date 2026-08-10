import { z } from "zod";

/**
 * Server environment, parsed once at the boundary (see DATA.md). Reading
 * `process.env` is centralized here — the lint config forbids it everywhere
 * else — and validated so a misconfigured deploy fails loudly at startup rather
 * than deep in a request.
 */
const envSchema = z.object({
  // Optional host suffix (e.g. `-your-team.vercel.app`) that scopes which
  // preview origins may receive an authenticated session handoff. Leave unset
  // to allow only the production origin.
  AUTH_PREVIEW_HOST_SUFFIX: z.string().optional(),
  // The base URL of the production deployment, where Google's single OAuth
  // redirect URI is registered. Every deployment (production and preview) sets
  // this to the same value and routes the OAuth callback through it, so preview
  // deployments can sign in without registering their own redirect URIs. No
  // trailing slash.
  AUTH_PROXY_URL: z.string().min(1),
  AUTH_SESSION_SECRET: z.string().min(16),
  CONCEPT2_CLIENT_ID: z.string().optional(),
  CONCEPT2_CLIENT_SECRET: z.string().optional(),
  CONCEPT2_REDIRECT_URI: z.string().optional(),
  DATABASE_URL: z.string().min(1),
  GOOGLE_ALLOWED_EMAILS: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

// biome-ignore lint/style/noProcessEnv: the single, validated env boundary
export const env: Env = envSchema.parse(process.env);
