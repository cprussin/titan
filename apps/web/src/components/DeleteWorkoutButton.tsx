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

/** Permanently deletes a completed workout from history after a confirmation
 *  prompt, then returns to the history list. */
export const DeleteWorkoutButton = ({ sessionId, size = "lg" }: Props) => {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const remove = () => {
    setDeleting(true);
    fetch(`/api/history/workouts/${sessionId}`, { method: "DELETE" })
      .then((response) => {
        if (response.ok) {
          router.push("/history");
          router.refresh();
        } else {
          throw new Error(`delete failed: ${response.status}`);
        }
      })
      .catch((error: unknown) => {
        setDeleting(false);
        // biome-ignore lint/suspicious/noConsole: surface a delete failure to the user's console
        console.error("Failed to delete workout", error);
      });
  };

  return (
    <ModalDialog
      footer={
        <>
          <ModalDialog.CloseButton variant="ghost">
            Keep workout
          </ModalDialog.CloseButton>
          <Button loading={deleting} onClick={remove} variant="danger">
            Delete workout
          </Button>
        </>
      }
      title="Delete this workout?"
      trigger={
        <Button size={size} variant="danger">
          Delete workout
        </Button>
      }
    >
      This permanently removes this workout and everything logged in it. It
      can&rsquo;t be undone.
    </ModalDialog>
  );
};
