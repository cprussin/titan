import type { ExerciseResult } from "@titan/domain/result";
import { exerciseResultSchema } from "@titan/domain/result";
import type { InProgressExercise } from "@titan/domain/workout-session";
import { inProgressExerciseSchema } from "@titan/domain/workout-session";
import { z } from "zod";

/** A set logged, edited, or undone. It reports only the sets underway — the
 *  recorded log is the server's. */
const setsSaveSchema = z.object({
  inProgress: inProgressExerciseSchema,
  kind: z.literal("sets"),
});

/** An exercise finished. Only the exercise itself is reported — the log it joins
 *  is the server's, so a client working from a stale view can add to it but can
 *  never shrink or rewrite it. */
const recordedSaveSchema = z.object({
  kind: z.literal("recorded"),
  recorded: exerciseResultSchema,
});

/** The last exercise finished, closing the session. */
const finishedSaveSchema = z.object({
  kind: z.literal("finished"),
  recorded: exerciseResultSchema,
});

/**
 * The body of a workout progress save, one variant per thing the athlete can
 * have just done — which is also what decides how the server writes it. A wire
 * contract, so the Zod schema is the source of truth and the discriminant stays
 * a literal (see DATA.md / DISCRIMINATED_UNIONS.md); it is shared by the route
 * and its client in the same deploy unit, so no versioning.
 */
export const workoutProgressRequestSchema = z.discriminatedUnion("kind", [
  setsSaveSchema,
  recordedSaveSchema,
  finishedSaveSchema,
]);

export type WorkoutProgressRequest = z.infer<
  typeof workoutProgressRequestSchema
>;

export const WorkoutProgressRequest = {
  /** The last exercise recorded, finishing the session. */
  Finished: (recorded: ExerciseResult): z.infer<typeof finishedSaveSchema> => ({
    kind: "finished",
    recorded,
  }),
  /** An exercise recorded, with the session carrying on to the next one. */
  Recorded: (recorded: ExerciseResult): z.infer<typeof recordedSaveSchema> => ({
    kind: "recorded",
    recorded,
  }),
  /** The sets logged so far against the exercise underway. */
  Sets: (inProgress: InProgressExercise): z.infer<typeof setsSaveSchema> => ({
    inProgress,
    kind: "sets",
  }),
};
