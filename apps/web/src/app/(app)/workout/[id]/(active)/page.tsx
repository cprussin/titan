import { listAdaptationDecisionsBySession } from "@titan/db/adaptation-decisions";
import { getConnection } from "@titan/db/external-connections";
import { getWorkoutSession } from "@titan/db/workout-sessions";
import type { AdaptationDecision } from "@titan/domain/adaptation-decision";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { WorkoutExecution } from "../../../../../components/WorkoutExecution";
import { db } from "../../../../../db";
import { exerciseModalities } from "../../../../../server/exercise-modalities";
import { exerciseNames } from "../../../../../server/exercise-names";
import { resumeWorkout } from "../../../../../server/resume-workout";
import { USER_ID } from "../../../../../user";

export const metadata: Metadata = {
  description: "Log today's session set by set.",
  title: "Workout",
};

const WorkoutPage = async ({ params }: { params: Promise<{ id: string }> }) => {
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
        const [names, modalities, decisions, connection] = await Promise.all([
          exerciseNames(db),
          exerciseModalities(db),
          listAdaptationDecisionsBySession(db, id),
          getConnection(db, USER_ID, "concept2"),
        ]);
        const resume = resumeWorkout(session);
        return (
          // The screen seeds its state from `resume` once, on mount. Keying it
          // to the exercise the session has reached means a refresh that finds
          // the workout moved on — recorded from another device — re-seeds it
          // there instead of leaving the athlete on a position that is gone.
          <WorkoutExecution
            concept2Connected={connection !== undefined}
            exerciseModalities={Object.fromEntries(modalities)}
            exerciseNames={Object.fromEntries(names)}
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
