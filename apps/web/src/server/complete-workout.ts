import { randomUUID } from "node:crypto";
import type { WeekSummary } from "@titan/adaptation-engine/weekly-adaptation";
import { evaluateWeek } from "@titan/adaptation-engine/weekly-adaptation";
import { insertAdaptationDecisions } from "@titan/db/adaptation-decisions";
import { getAthleteState, setAthleteState } from "@titan/db/athlete-state";
import type { Db } from "@titan/db/client";
import { upsertPersonalRecord } from "@titan/db/personal-records";
import { getProgramVersion } from "@titan/db/program-versions";
import {
  getWorkoutSession,
  listWorkoutSessions,
  upsertWorkoutSession,
} from "@titan/db/workout-sessions";
import type { AdaptationDecision } from "@titan/domain/adaptation-decision";
import { estimateOneRepMax } from "@titan/domain/one-rep-max";
import type { PersonalRecord } from "@titan/domain/personal-record";
import type { ExerciseResult } from "@titan/domain/result";
import type { WorkoutSession } from "@titan/domain/workout-session";
import { detectPersonalRecords } from "./detect-personal-records";
import { stampResultTimes } from "./stamp-result-times";

export type CompletionResult = {
  personalRecords: readonly PersonalRecord[];
};

/**
 * Finalize a session: store its results, detect personal records, and — if it
 * was the last scheduled day of the week — run weekly adaptation and advance the
 * athlete's position. Returns the PRs for the completion screen.
 */
export const completeWorkout = async (
  db: Db,
  userId: string,
  sessionId: string,
  results: readonly ExerciseResult[],
): Promise<CompletionResult> => {
  const session = await getWorkoutSession(db, sessionId);
  if (session === undefined) {
    throw new Error(`workout session ${sessionId} not found`);
  } else {
    const completedAt = new Date().toISOString();
    const completed: WorkoutSession = {
      ...session,
      completedAt,
      results: stampResultTimes(session.results, results, completedAt),
      status: "completed",
    };
    await upsertWorkoutSession(db, completed);

    const priorBest = await priorOneRepMaxByExercise(db, userId, sessionId);
    const personalRecords = detectPersonalRecords({
      achievedAt: completedAt,
      newId: randomUUID,
      priorBestByExercise: priorBest,
      session: completed,
    });
    await Promise.all(
      personalRecords.map((record) => upsertPersonalRecord(db, record)),
    );

    await maybeAdvanceWeek(db, userId, completed);
    return { personalRecords };
  }
};

const priorOneRepMaxByExercise = async (
  db: Db,
  userId: string,
  excludeSessionId: string,
): Promise<Map<string, number>> => {
  const sessions = await listWorkoutSessions(db, userId, 500);
  const results = sessions
    .filter(
      (session) =>
        session.status === "completed" && session.id !== excludeSessionId,
    )
    .flatMap((session) => session.results);
  const best = new Map<string, number>();
  for (const result of results) {
    for (const set of result.sets) {
      if (
        set.completed &&
        set.reps !== undefined &&
        set.reps > 0 &&
        set.weight !== undefined &&
        set.weight > 0
      ) {
        const estimate = estimateOneRepMax(set.weight, set.reps);
        if (estimate > (best.get(result.exerciseId) ?? 0)) {
          best.set(result.exerciseId, estimate);
        }
      }
    }
  }
  return best;
};

const maybeAdvanceWeek = async (
  db: Db,
  userId: string,
  session: WorkoutSession,
): Promise<void> => {
  const programVersion = await getProgramVersion(db, session.programVersionId);
  const block = programVersion?.blocks.find(
    (entry) => entry.id === session.blockId,
  );
  const lastScheduledDay =
    block === undefined
      ? undefined
      : Math.max(...block.weekTemplate.days.map((day) => day.dayOfWeek));
  if (
    block !== undefined &&
    lastScheduledDay !== undefined &&
    session.dayOfWeek === lastScheduledDay
  ) {
    await advanceWeek(db, userId, session, block.deloadEveryWeeks);
  }
};

const advanceWeek = async (
  db: Db,
  userId: string,
  session: WorkoutSession,
  deloadEveryWeeks: number | undefined,
): Promise<void> => {
  const weekSessions = await listWorkoutSessions(db, userId, 100);
  const summary = summarizeWeek(weekSessions, session, deloadEveryWeeks);
  const note = evaluateWeek(summary);
  const decision: AdaptationDecision = {
    action: note.action,
    createdAt: new Date().toISOString(),
    explanation: note.explanation,
    id: randomUUID(),
    layer: "weekly",
    userId,
    workoutSessionId: session.id,
    ...(note.details === undefined ? {} : { details: note.details }),
  };
  await insertAdaptationDecisions(db, [decision]);
  const state = await getAthleteState(db, userId);
  if (state !== undefined) {
    await setAthleteState(db, {
      ...state,
      absoluteWeek:
        note.action === "repeat-week"
          ? state.absoluteWeek
          : state.absoluteWeek + 1,
      updatedAt: new Date().toISOString(),
    });
  }
};

const summarizeWeek = (
  sessions: readonly WorkoutSession[],
  current: WorkoutSession,
  deloadEveryWeeks: number | undefined,
): WeekSummary => {
  const thisWeek = sessions.filter(
    (session) =>
      session.programVersionId === current.programVersionId &&
      session.weekNumber === current.weekNumber &&
      session.status === "completed",
  );
  const rpes = thisWeek
    .flatMap((session) => session.results)
    .flatMap((result) => result.sets)
    .map((set) => set.rpe)
    .filter((rpe): rpe is number => rpe !== undefined);
  const avgRpe =
    rpes.length === 0
      ? undefined
      : rpes.reduce((sum, rpe) => sum + rpe, 0) / rpes.length;
  const completionPct = Math.min(1, thisWeek.length / 7);
  return {
    cardioProgressed: completionPct >= 0.8,
    completionPct,
    strengthProgressed: completionPct >= 0.8,
    weeksSinceDeload: (current.weekNumber - 1) % (deloadEveryWeeks ?? 999),
    ...(avgRpe === undefined ? {} : { avgRpe }),
    ...(deloadEveryWeeks === undefined ? {} : { deloadEveryWeeks }),
  };
};
