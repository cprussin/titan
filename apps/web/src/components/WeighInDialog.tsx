"use client";

import type { ReactElement } from "react";
import { useState } from "react";
import { ModalDialog } from "../ui";
import { BodyWeightForm } from "./BodyWeightForm";

type Props = {
  /** The control that opens the dialog. */
  trigger: ReactElement;
};

/**
 * A weigh-in entry point: `trigger` opens a dialog hosting the bodyweight form,
 * which closes itself once today's weigh-in is saved. Every weigh-in affordance
 * wraps it — the dashboard headline's button, the floating action area and
 * sidebar's secondary button, and the trends section's inline control — so they
 * all open the same form.
 */
export const WeighInDialog = ({ trigger }: Props) => {
  const [open, setOpen] = useState(false);
  return (
    <ModalDialog
      onOpenChange={setOpen}
      open={open}
      title="Log weigh-in"
      trigger={trigger}
    >
      <BodyWeightForm
        onLogged={() => {
          setOpen(false);
        }}
      />
    </ModalDialog>
  );
};
