"use client";

import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ModalDialog } from "../ui";

type Props = {
  /** The DELETE endpoint that removes this entry. */
  endpoint: string;
  /** Singular noun for the entry, woven into the confirmation copy and the
   *  trigger's accessible label (e.g. "workout", "weigh-in"). */
  itemLabel: string;
};

/** A compact trash button that deletes a single history entry after a
 *  confirmation prompt, then refreshes so the removed row disappears. */
export const DeleteEntryButton = ({ endpoint, itemLabel }: Props) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const remove = () => {
    setDeleting(true);
    fetch(endpoint, { method: "DELETE" })
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
        console.error(`Failed to delete ${itemLabel}`, error);
      });
  };

  return (
    <ModalDialog
      footer={
        <>
          <ModalDialog.CloseButton variant="ghost">
            Keep
          </ModalDialog.CloseButton>
          <Button loading={deleting} onClick={remove} variant="danger">
            Delete
          </Button>
        </>
      }
      onOpenChange={setOpen}
      open={open}
      title={`Delete this ${itemLabel}?`}
      trigger={
        <Button label={`Delete ${itemLabel}`} size="sm" variant="ghost">
          <TrashIcon />
        </Button>
      }
    >
      This permanently removes the {itemLabel}. It can&rsquo;t be undone.
    </ModalDialog>
  );
};
