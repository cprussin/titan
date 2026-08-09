"use client";

import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { useState } from "react";
import { Button, ModalDialog } from "../ui";
import { BodyWeightForm } from "./BodyWeightForm";

/** Opens a dialog to log today's weigh-in, closing once it's saved. */
export const LogWeightButton = () => {
  const [open, setOpen] = useState(false);
  return (
    <ModalDialog
      onOpenChange={setOpen}
      open={open}
      title="Log weigh-in"
      trigger={
        <Button beforeIcon={<PlusIcon />} size="sm" variant="solid">
          Log
        </Button>
      }
    >
      <BodyWeightForm
        onLogged={() => {
          setOpen(false);
        }}
      />
    </ModalDialog>
  );
};
