import type { AdaptationDecision } from "@titan/domain/adaptation-decision";
import type {
  PrescribedExercise,
  WorkoutSession,
} from "@titan/domain/workout-session";
import type { SessionDecision } from "@titan/program-engine/resolve-session";

/** Everything needed to turn a resolved plan into a persistable session. IO —
 *  id minting and the timestamp — is injected so this stays pure and testable. */
export type BuildSessionInput = {
  createdAt: string;
  dayOfWeek: number;
  decisions: readonly SessionDecision[];
  estimatedDurationMin: number;
  newId: () => string;
  prescribedExercises: readonly PrescribedExercise[];
  programVersionId: string;
  blockId: string;
  weekNumber: number;
  readinessId: string | undefined;
  scheduledDate: string;
  sessionTemplateId: string;
  userId: string;
  variantLabel: string | undefined;
};

export type BuiltSession = {
  decisions: readonly AdaptationDecision[];
  session: WorkoutSession;
};

/**
 * Assemble the in-progress {@link WorkoutSession} and the
 * {@link AdaptationDecision} records that explain today's prescription. The
 * decisions are stored alongside the session so the Workout Complete screen can
 * show *why* every number is what it is (see the spec's "Product Philosophy").
 */
export const buildSession = (input: BuildSessionInput): BuiltSession => {
  const sessionId = input.newId();
  const decisions = input.decisions.map(
    (decision): AdaptationDecision => ({
      action: decision.action,
      createdAt: input.createdAt,
      exerciseId: decision.exerciseId,
      explanation: decision.explanation,
      id: input.newId(),
      layer: "exercise",
      sessionTemplateId: input.sessionTemplateId,
      userId: input.userId,
      workoutSessionId: sessionId,
      ...(decision.details === undefined ? {} : { details: decision.details }),
    }),
  );
  const session: WorkoutSession = {
    adaptationDecisionIds: decisions.map((decision) => decision.id),
    blockId: input.blockId,
    dayOfWeek: input.dayOfWeek,
    estimatedDurationMin: input.estimatedDurationMin,
    id: sessionId,
    prescribedExercises: [...input.prescribedExercises],
    programVersionId: input.programVersionId,
    results: [],
    scheduledDate: input.scheduledDate,
    sessionTemplateId: input.sessionTemplateId,
    startedAt: input.createdAt,
    status: "in-progress",
    userId: input.userId,
    weekNumber: input.weekNumber,
    ...(input.readinessId === undefined
      ? {}
      : { readinessId: input.readinessId }),
    ...(input.variantLabel === undefined
      ? {}
      : { variantLabel: input.variantLabel }),
  };
  return { decisions, session };
};
