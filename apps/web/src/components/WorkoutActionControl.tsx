"use client";

import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import type { WorkoutAction } from "../server/workout-action";
import { Button } from "../ui";
import { StartWorkout } from "./StartWorkout";

type Props = {
  action: WorkoutAction;
  /** Pill the control for the mobile FAB; leave square elsewhere. */
  rounded?: boolean | undefined;
  /** The control height. `xl` for the prominent mobile FAB; `lg` (default)
   *  everywhere the control docks inline. */
  size?: "lg" | "xl" | undefined;
  /** Render the control as an icon-only circle for the mobile FAB stack, its
   *  name carried by `aria-label` with the visible label sitting beside it. */
  iconOnly?: boolean | undefined;
};

/**
 * The primary workout action itself, shared by the app-wide chrome button
 * ({@link WorkoutActionButton}) and the dashboard's Today card. The two states
 * read distinctly: `start` is the bold accent "begin" action, while `continue`
 * takes the neutral solid fill with a forward arrow — clearly not a fresh
 * start, without competing with it for attention.
 */
export const WorkoutActionControl = ({
  action,
  rounded = false,
  size = "lg",
  iconOnly = false,
}: Props) =>
  action.kind === "continue" ? (
    iconOnly ? (
      <Button
        href={`/workout/${action.sessionId}`}
        label="Continue workout"
        rounded={rounded}
        size={size}
        variant={rounded ? "accent" : "solid"}
      >
        <ArrowRightIcon size={20} weight="bold" />
      </Button>
    ) : (
      <Button
        beforeIcon={<ArrowRightIcon size={20} weight="bold" />}
        href={`/workout/${action.sessionId}`}
        rounded={rounded}
        size={size}
        variant={rounded ? "accent" : "solid"}
      >
        Continue workout
      </Button>
    )
  ) : (
    <StartWorkout iconOnly={iconOnly} rounded={rounded} size={size} />
  );
