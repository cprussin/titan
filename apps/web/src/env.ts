import { z } from "zod";

/**
 * Server environment, parsed once at the boundary (see DATA.md). Reading
 * `process.env` is centralized here — the lint config forbids it everywhere
 * else — and validated so a misconfigured deploy fails loudly at startup rather
 * than deep in a request.
 */
const envSchema = z.object({
  AUTH_PASSWORD: z.string().min(1),
  AUTH_SESSION_SECRET: z.string().min(16),
  CONCEPT2_CLIENT_ID: z.string().optional(),
  CONCEPT2_CLIENT_SECRET: z.string().optional(),
  CONCEPT2_REDIRECT_URI: z.string().optional(),
  DATABASE_URL: z.string().min(1),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

// biome-ignore lint/style/noProcessEnv: the single, validated env boundary
export const env: Env = envSchema.parse(process.env);
