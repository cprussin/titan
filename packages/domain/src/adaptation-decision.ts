import { z } from "zod";
import { idSchema } from "./ids";

/**
 * A recorded, explained **adaptation decision**. Every progression, deload,
 * session cut, or weekly action the engines make is stored as one of these,
 * carrying a plain-English {@link explanation}. Nothing adapts silently (see the
 * spec's "Product Philosophy").
 */

/** Which of the three adaptation layers produced the decision. */
export const adaptationLayerSchema = z.enum(["exercise", "session", "weekly"]);

export type AdaptationLayer = z.infer<typeof adaptationLayerSchema>;

/** The concrete action taken. Persisted as a string so new actions are additive. */
export const adaptationActionSchema = z.enum([
  "increase-load",
  "increase-reps",
  "increase-duration",
  "advance-pace",
  "maintain",
  "repeat",
  "deload",
  "remove-accessory",
  "reduce-intensity",
  "advance-week",
  "repeat-week",
  "trigger-deload",
  "substitute-session",
  "reduce-volume",
]);

export type AdaptationAction = z.infer<typeof adaptationActionSchema>;

export const adaptationDecisionSchema = z.object({
  action: adaptationActionSchema,
  createdAt: z.string(),
  /** Structured before/after values backing the explanation (e.g.
   *  `{ from: 100, to: 102.5, avgRpe: 7.8 }`, in the exercise's load unit).
   *  Numbers only, for analytics. */
  details: z.record(z.string(), z.number()).optional(),
  exerciseId: idSchema.optional(),
  /** Human-readable justification, always present. */
  explanation: z.string(),
  id: idSchema,
  layer: adaptationLayerSchema,
  sessionTemplateId: idSchema.optional(),
  userId: idSchema,
  workoutSessionId: idSchema.optional(),
});

export type AdaptationDecision = z.infer<typeof adaptationDecisionSchema>;
