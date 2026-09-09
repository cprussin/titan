"use client";

import { ScalesIcon } from "@phosphor-icons/react/dist/ssr/Scales";
import { Button } from "../ui";
import { WeighInDialog } from "./WeighInDialog";

/** The headline's weigh-in trigger: opens the same weigh-in dialog as the
 *  floating action area's button. Sits beside the primary action and stays
 *  available on any day, whether or not today is already logged. */
export const WeighInButton = () => (
  <WeighInDialog
    trigger={
      <Button beforeIcon={<ScalesIcon size={16} />} size="md" variant="ghost">
        Weigh in
      </Button>
    }
  />
);
