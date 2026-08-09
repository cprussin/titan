"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ModalDialog } from "../ui";

/** Permanently deletes all logged workouts and weigh-ins after a confirmation
 *  prompt, then refreshes so the cleared history is reflected. */
export const DeleteHistoryButton = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const deleteHistory = () => {
    setDeleting(true);
    fetch("/api/history", { method: "DELETE" })
      .then((response) => {
        if (response.ok) {
          setDeleting(false);
          setOpen(false);
          router.refresh();
        } else {
          throw new Error(`delete failed: ${response.status}`);
        }
      })
      .catch((error: unknown) => {
        setDeleting(false);
        // biome-ignore lint/suspicious/noConsole: surface a delete failure to the user's console
        console.error("Failed to delete history", error);
      });
  };

  return (
    <ModalDialog
      footer={
        <>
          <ModalDialog.CloseButton variant="ghost">
            Keep history
          </ModalDialog.CloseButton>
          <Button loading={deleting} onClick={deleteHistory} variant="danger">
            Delete history
          </Button>
        </>
      }
      onOpenChange={setOpen}
      open={open}
      title="Delete all history?"
      trigger={<Button variant="danger">Delete history</Button>}
    >
      This permanently deletes every logged workout and weigh-in. It can&rsquo;t
      be undone.
    </ModalDialog>
  );
};
