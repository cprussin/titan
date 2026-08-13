"use client";

import { ScalesIcon } from "@phosphor-icons/react/dist/ssr/Scales";
import { Button } from "../ui";
import { useWeighIn } from "./WeighInContext";

/** The headline's weigh-in trigger: opens the body-weight trend card's inline
 *  editor. Sits beside the primary action and stays available on any day,
 *  whether or not today is already logged. */
export const WeighInButton = () => {
  const { open } = useWeighIn();
  return (
    <Button
      beforeIcon={<ScalesIcon size={16} />}
      onClick={open}
      size="md"
      variant="ghost"
    >
      Weigh in
    </Button>
  );
};
