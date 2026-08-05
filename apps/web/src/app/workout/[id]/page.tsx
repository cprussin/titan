import { getWorkoutSession } from "@titan/db/workout-sessions";
import { notFound, redirect } from "next/navigation";
import { requireAuth } from "../../../auth/session";
import { WorkoutExecution } from "../../../components/WorkoutExecution";
import { db } from "../../../db";
import { exerciseNames } from "../../../server/exercise-names";

const WorkoutPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  await requireAuth();
  const { id } = await params;
  const session = await getWorkoutSession(db, id);
  if (session === undefined) {
    notFound();
  } else if (session.status === "completed") {
    redirect(`/workout/${id}/complete`);
  } else {
    const names = await exerciseNames(db);
    return (
      <WorkoutExecution
        exerciseNames={Object.fromEntries(names)}
        prescribedExercises={session.prescribedExercises}
        sessionId={id}
      />
    );
  }
};

export default WorkoutPage;
