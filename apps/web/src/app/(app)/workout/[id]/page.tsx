import { getWorkoutSession } from "@titan/db/workout-sessions";
import { notFound, redirect } from "next/navigation";
import { WorkoutExecution } from "../../../../components/WorkoutExecution";
import { db } from "../../../../db";
import { exerciseNames } from "../../../../server/exercise-names";
import { templateNames } from "../../../../server/template-names";

const WorkoutPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const session = await getWorkoutSession(db, id);
  if (session === undefined) {
    notFound();
  } else if (session.status === "completed") {
    redirect(`/workout/${id}/complete`);
  } else {
    const [names, templates] = await Promise.all([
      exerciseNames(db),
      templateNames(db),
    ]);
    return (
      <WorkoutExecution
        exerciseNames={Object.fromEntries(names)}
        prescribedExercises={session.prescribedExercises}
        sessionId={id}
        title={templates.get(session.sessionTemplateId) ?? "Workout"}
      />
    );
  }
};

export default WorkoutPage;
