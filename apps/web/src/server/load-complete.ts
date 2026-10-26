import type { Db } from "@titan/db/client";
import { listPersonalRecords } from "@titan/db/personal-records";
import type { WorkoutSession } from "@titan/domain/workout-session";
import type { CompleteData } from "../components/CompleteContent";
import { sessionDurationMin } from "../session-duration";
import { exerciseNames } from "./exercise-names";
import { nextSessionAdaptations } from "./next-adaptations";

/** A finished session's summary: its stats, log, personal records, and what
 *  changes next time. Shared by the completion page and the Android app. */
export const loadComplete = async (
  db: Db,
  userId: string,
  session: WorkoutSession,
): Promise<CompleteData> => {
  const [adaptations, records, names] = await Promise.all([
    nextSessionAdaptations(db, session),
    listPersonalRecords(db, userId),
    exerciseNames(db),
  ]);
  const sessionRecords = records.filter(
    (record) => record.workoutSessionId === session.id,
  );
  const totalSets = session.results.reduce(
    (count, result) => count + result.sets.length,
    0,
  );
  return {
    adaptations: adaptations.map((adaptation) => ({
      exerciseName: names.get(adaptation.exerciseId) ?? adaptation.exerciseId,
      explanation: adaptation.explanation,
      progressed: adaptation.progressed,
      slotId: adaptation.slotId,
    })),
    exerciseNames: names,
    personalRecords: sessionRecords.map((record) => ({
      id: record.id,
      name: names.get(record.exerciseId) ?? record.exerciseId,
      text: `${record.value} ${record.unit} est. 1RM`,
    })),
    results: session.results,
    scheduledDate: session.scheduledDate,
    sessionId: session.id,
    stats: {
      durationMin: sessionDurationMin(session),
      prCount: sessionRecords.length,
      totalSets,
    },
  };
};
