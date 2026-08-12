import { z } from "zod";
import { idSchema } from "./ids";
import { cardioResultSchema, intervalResultSchema } from "./result";

/**
 * External integration state. An {@link ExternalConnection} holds a provider's
 * OAuth tokens; an {@link ExternalWorkout} is an imported activity, stored with
 * its raw API payload, a normalized form, and a match status so an import can be
 * re-normalized or re-matched later without re-fetching (see the spec's
 * "Concept2 Integration").
 */

export const externalProviderSchema = z.enum(["concept2"]);

export type ExternalProvider = z.infer<typeof externalProviderSchema>;

export const externalConnectionSchema = z.object({
  accessToken: z.string(),
  /** Epoch milliseconds at which the access token expires. */
  expiresAt: z.number().int(),
  externalUserId: z.string().optional(),
  id: idSchema,
  provider: externalProviderSchema,
  refreshToken: z.string(),
  scope: z.string().optional(),
  userId: idSchema,
});

export type ExternalConnection = z.infer<typeof externalConnectionSchema>;

export const matchStatusSchema = z.enum(["unmatched", "matched", "ignored"]);

export type MatchStatus = z.infer<typeof matchStatusSchema>;

/** The provider-neutral normalized form of an imported workout. */
export const normalizedWorkoutSchema = z.object({
  intervals: z.array(intervalResultSchema),
  summary: cardioResultSchema,
  /** ISO timestamp the workout was performed. */
  workoutAt: z.string(),
});

export type NormalizedWorkout = z.infer<typeof normalizedWorkoutSchema>;

export const externalWorkoutSchema = z.object({
  connectionId: idSchema,
  /** The provider's opaque workout id, for dedupe. */
  externalId: z.string(),
  id: idSchema,
  importedAt: z.string(),
  matchedWorkoutSessionId: idSchema.optional(),
  matchStatus: matchStatusSchema,
  normalized: normalizedWorkoutSchema,
  provider: externalProviderSchema,
  /** The raw provider payload, retained verbatim. */
  raw: z.unknown(),
  userId: idSchema,
});

export type ExternalWorkout = z.infer<typeof externalWorkoutSchema>;
