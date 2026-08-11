"use client";

import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { Button } from "../ui";
import { WeighInDialog } from "./WeighInDialog";

/** Opens a dialog to log today's weigh-in, closing once it's saved. */
export const LogWeightButton = () => (
  <WeighInDialog
    trigger={
      <Button beforeIcon={<PlusIcon />} size="sm" variant="solid">
        Log
      </Button>
    }
  />
);
