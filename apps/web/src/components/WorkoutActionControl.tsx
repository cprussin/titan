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
 * ({@link WorkoutActionButton}) and the dashboard's Today card. The two live
 * states read distinctly: `start` is the bold accent "begin" action, while
 * `continue` takes the neutral solid fill with a forward arrow — clearly not a
 * fresh start, without competing with it for attention. A `done` day has no
 * action to launch, so it renders nothing.
 */
export const WorkoutActionControl = ({
  action,
  rounded = false,
  size = "lg",
  iconOnly = false,
}: Props) => {
  switch (action.kind) {
    case "continue": {
      return (
        <ContinueWorkout
          iconOnly={iconOnly}
          rounded={rounded}
          sessionId={action.sessionId}
          size={size}
        />
      );
    }
    case "start": {
      return <StartWorkout iconOnly={iconOnly} rounded={rounded} size={size} />;
    }
    case "done": {
      return undefined;
    }
  }
};

type ContinueWorkoutProps = {
  /** The in-progress session the control links into. */
  sessionId: string;
} & Pick<Props, "iconOnly" | "rounded" | "size">;

/**
 * The `continue` control: a neutral solid button (accent when pilled for the
 * FAB) carrying a forward arrow into the in-progress session. Icon-only for the
 * mobile FAB stack — its name carried by `aria-label` — and labelled inline
 * everywhere else.
 */
const ContinueWorkout = ({
  sessionId,
  rounded = false,
  size = "lg",
  iconOnly = false,
}: ContinueWorkoutProps) =>
  iconOnly ? (
    <Button
      href={`/workout/${sessionId}`}
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
      href={`/workout/${sessionId}`}
      rounded={rounded}
      size={size}
      variant={rounded ? "accent" : "solid"}
    >
      Continue workout
    </Button>
  );
