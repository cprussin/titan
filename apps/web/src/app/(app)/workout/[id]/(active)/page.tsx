import { listAdaptationDecisionsBySession } from "@titan/db/adaptation-decisions";
import { getWorkoutSession } from "@titan/db/workout-sessions";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireAuth } from "../../../../../auth/session";
import { WorkoutExecution } from "../../../../../components/WorkoutExecution";
import { db } from "../../../../../db";
import { explanationsByExercise } from "../../../../../server/explanations-by-exercise";
import { loadExecutionContext } from "../../../../../server/load-execution-context";
import { resumeWorkout } from "../../../../../server/resume-workout";
import { USER_ID } from "../../../../../user";

export const metadata: Metadata = {
  description: "Log today's session set by set.",
  title: "Workout",
};

const WorkoutPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  await requireAuth();
  const { id } = await params;
  const session = await getWorkoutSession(db, id);
  if (session === undefined) {
    notFound();
  } else {
    switch (session.status) {
      case "completed": {
        // `redirect` and `notFound` never return; returning their call keeps
        // that visible to the linter, which reads a bare call as fallthrough.
        return redirect(`/workout/${id}/complete`);
      }
      case "in-progress": {
        const [context, decisions] = await Promise.all([
          loadExecutionContext(db, USER_ID),
          listAdaptationDecisionsBySession(db, id),
        ]);
        const resume = resumeWorkout(session);
        return (
          // The screen seeds its state from `resume` once, on mount. Keying it
          // to the exercise the session has reached means a refresh that finds
          // the workout moved on — recorded from another device — re-seeds it
          // there instead of leaving the athlete on a position that is gone.
          <WorkoutExecution
            concept2Connected={context.concept2Connected}
            exerciseModalities={context.exerciseModalities}
            exerciseNames={context.exerciseNames}
            explanations={explanationsByExercise(decisions)}
            key={resume.index}
            prescribedExercises={session.prescribedExercises}
            resume={resume}
            sessionId={id}
          />
        );
      }
      // Every save the screen issues writes conditionally on the session being
      // in progress, so a session in any other state would render a logger that
      // records nothing: the page's precondition is the write's precondition.
      // Switching without a `default` means a new status has to be placed here
      // deliberately rather than silently landing on the execution screen.
      case "scheduled":
      case "skipped": {
        return notFound();
      }
    }
  }
};

export default WorkoutPage;
