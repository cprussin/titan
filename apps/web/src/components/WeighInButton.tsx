"use client";

import { ScalesIcon } from "@phosphor-icons/react/dist/ssr/Scales";
import { Button } from "../ui";
import { useWeighIn } from "./WeighInContext";

type Props = {
  /** Once today's weigh-in is logged the button hides for the rest of the day. */
  weighedInToday: boolean;
};

/** The headline's weigh-in trigger: opens the body-weight trend card's inline
 *  editor. Sits beside the primary action and hides once today is logged. */
export const WeighInButton = ({ weighedInToday }: Props) => {
  const { open } = useWeighIn();
  return weighedInToday ? undefined : (
    <Button
      beforeIcon={<ScalesIcon size={16} />}
      onClick={open}
      size="md"
      variant="outline"
    >
      Weigh in
    </Button>
  );
};
