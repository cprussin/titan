import { listPersonalRecords } from "@titan/db/personal-records";
import { getWorkoutSession } from "@titan/db/workout-sessions";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CompleteData } from "../../../../../components/CompleteContent";
import { CompleteContent } from "../../../../../components/CompleteContent";
import { db } from "../../../../../db";
import { exerciseNames } from "../../../../../server/exercise-names";
import { nextSessionAdaptations } from "../../../../../server/next-adaptations";
import { sessionDurationMin } from "../../../../../session-duration";
import { USER_ID } from "../../../../../user";

export const metadata: Metadata = {
  description: "Your session summary and what changes next time.",
  title: "Workout complete",
};

const CompletePage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const session = await getWorkoutSession(db, id);
  if (session === undefined) {
    notFound();
  } else {
    const [adaptations, records, names] = await Promise.all([
      nextSessionAdaptations(db, session),
      listPersonalRecords(db, USER_ID),
      exerciseNames(db),
    ]);
    const sessionRecords = records.filter(
      (record) => record.workoutSessionId === id,
    );
    const totalSets = session.results.reduce(
      (count, result) => count + result.sets.length,
      0,
    );

    const data: CompleteData = {
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
      sessionId: id,
      stats: {
        durationMin: sessionDurationMin(session),
        prCount: sessionRecords.length,
        totalSets,
      },
    };

    return <CompleteContent load={{ isLoading: false, value: data }} />;
  }
};

export default CompletePage;
