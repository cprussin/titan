"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ModalDialog } from "../ui";

type Props = {
  sessionId: string;
  /** The trigger button's size — compact where it sits inline with other
   *  chrome, larger where it stands alone. Defaults to `lg`. */
  size?: "sm" | "lg";
};

/** Cancels an in-progress workout after a confirmation prompt: discards the
 *  session and its logged progress, then returns to today's plan. */
export const CancelWorkoutButton = ({ sessionId, size = "lg" }: Props) => {
  const router = useRouter();
  const [canceling, setCanceling] = useState(false);

  const cancel = () => {
    setCanceling(true);
    fetch(`/api/workouts/${sessionId}`, { method: "DELETE" })
      .then((response) => {
        if (response.ok) {
          router.push("/");
          router.refresh();
        } else {
          throw new Error(`cancel failed: ${response.status}`);
        }
      })
      .catch((error: unknown) => {
        setCanceling(false);
        // biome-ignore lint/suspicious/noConsole: surface a cancel failure to the user's console
        console.error("Failed to cancel workout", error);
      });
  };

  return (
    <ModalDialog
      footer={
        <>
          <ModalDialog.CloseButton variant="ghost">
            Keep going
          </ModalDialog.CloseButton>
          <Button loading={canceling} onClick={cancel} variant="danger">
            Cancel workout
          </Button>
        </>
      }
      title="Cancel workout?"
      trigger={
        <Button size={size} variant="danger">
          Cancel workout
        </Button>
      }
    >
      This discards everything you&rsquo;ve logged in this session and returns
      to today&rsquo;s plan. It can&rsquo;t be undone.
    </ModalDialog>
  );
};
