import { listAdaptationDecisionsBySession } from "@titan/db/adaptation-decisions";
import { getConnection } from "@titan/db/external-connections";
import { getWorkoutSession } from "@titan/db/workout-sessions";
import type { AdaptationDecision } from "@titan/domain/adaptation-decision";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { WorkoutExecution } from "../../../../components/WorkoutExecution";
import { db } from "../../../../db";
import { exerciseModalities } from "../../../../server/exercise-modalities";
import { exerciseNames } from "../../../../server/exercise-names";
import { USER_ID } from "../../../../user";

export const metadata: Metadata = {
  description: "Log today's session set by set.",
  title: "Workout",
};

const WorkoutPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const session = await getWorkoutSession(db, id);
  if (session === undefined) {
    notFound();
  } else if (session.status === "completed") {
    redirect(`/workout/${id}/complete`);
  } else {
    const [names, modalities, decisions, connection] = await Promise.all([
      exerciseNames(db),
      exerciseModalities(db),
      listAdaptationDecisionsBySession(db, id),
      getConnection(db, USER_ID, "concept2"),
    ]);
    return (
      <WorkoutExecution
        concept2Connected={connection !== undefined}
        exerciseModalities={Object.fromEntries(modalities)}
        exerciseNames={Object.fromEntries(names)}
        explanations={explanationsByExercise(decisions)}
        prescribedExercises={session.prescribedExercises}
        sessionId={id}
      />
    );
  }
};

/** Maps each exercise-layer adaptation decision to its explanation, keyed by
 *  exercise id, so the execution screen can surface why today's target is what
 *  it is. Non-exercise decisions (session/weekly) carry no exercise id and are
 *  dropped. */
const explanationsByExercise = (
  decisions: readonly AdaptationDecision[],
): Record<string, string> =>
  Object.fromEntries(
    decisions.flatMap((decision) =>
      decision.exerciseId === undefined
        ? []
        : [[decision.exerciseId, decision.explanation] as const],
    ),
  );

export default WorkoutPage;
