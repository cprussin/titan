"use client";

import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import type { WorkoutAction } from "../server/workout-action";
import { Button } from "../ui";
import { StartWorkout } from "./StartWorkout";

type Props = {
  action: WorkoutAction;
  /** Pill the control for the mobile FAB; leave square elsewhere. */
  rounded?: boolean | undefined;
};

/**
 * The primary workout action itself, shared by the app-wide chrome button
 * ({@link WorkoutActionButton}) and the dashboard's Today card. The two states
 * read distinctly: `start` is the bold accent "begin" action, while `continue`
 * takes the neutral solid fill with a forward arrow — clearly not a fresh
 * start, without competing with it for attention.
 */
export const WorkoutActionControl = ({ action, rounded = false }: Props) =>
  action.kind === "continue" ? (
    <Button
      beforeIcon={<ArrowRightIcon size={20} weight="bold" />}
      href={`/workout/${action.sessionId}`}
      rounded={rounded}
      size="lg"
      variant="solid"
    >
      Continue workout
    </Button>
  ) : (
    <StartWorkout rounded={rounded} />
  );
