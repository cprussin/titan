"use client";

import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ModalDialog } from "../ui";

/** Remove one history entry. Throws on a failed delete so the caller surfaces
 *  it rather than pretending the entry is gone. */
export const deleteEntry = async (endpoint: string): Promise<void> => {
  const response = await fetch(endpoint, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`delete failed: ${response.status}`);
  }
};

type Props = {
  /** The DELETE endpoint that removes this entry. */
  endpoint: string;
  /** Singular noun for the entry, woven into the confirmation copy and the
   *  trigger's accessible label (e.g. "workout", "weigh-in"). */
  itemLabel: string;
  /** Called after the entry is gone — for a list the server didn't render, so
   *  it can reload itself. A page rendered from the server needs nothing here:
   *  the refresh below already redraws it. */
  onDeleted?: (() => void) | undefined;
  /** Injected for tests; defaults to the real DELETE. */
  remove?: typeof deleteEntry;
};

/** A compact trash button that deletes a single history entry after a
 *  confirmation prompt, then refreshes so the removed row disappears. */
export const DeleteEntryButton = ({
  endpoint,
  itemLabel,
  onDeleted,
  remove = deleteEntry,
}: Props) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = () => {
    setDeleting(true);
    remove(endpoint)
      .then(() => {
        setDeleting(false);
        setOpen(false);
        router.refresh();
        onDeleted?.();
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
          <Button loading={deleting} onClick={confirmDelete} variant="danger">
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
