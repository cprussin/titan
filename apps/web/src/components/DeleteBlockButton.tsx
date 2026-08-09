"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ModalDialog } from "../ui";

type Props = {
  blockId: string;
  blockName: string;
  versionId: string;
};

/** Deletes a block after a confirmation prompt by minting a new program version
 *  without it, then returns to the programs index since this block's detail view
 *  no longer exists. Logged workouts keep referencing the version they were
 *  prescribed from, so history is untouched. */
export const DeleteBlockButton = ({ blockId, blockName, versionId }: Props) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const deleteBlock = () => {
    setDeleting(true);
    fetch(`/api/program-versions/${versionId}/blocks/${blockId}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (response.ok) {
          setDeleting(false);
          setOpen(false);
          router.push("/programs");
        } else {
          throw new Error(`delete failed: ${response.status}`);
        }
      })
      .catch((error: unknown) => {
        setDeleting(false);
        // biome-ignore lint/suspicious/noConsole: surface a delete failure to the user's console
        console.error("Failed to delete block", error);
      });
  };

  return (
    <ModalDialog
      footer={
        <>
          <ModalDialog.CloseButton variant="ghost">
            Keep block
          </ModalDialog.CloseButton>
          <Button loading={deleting} onClick={deleteBlock} variant="danger">
            Delete block
          </Button>
        </>
      }
      onOpenChange={setOpen}
      open={open}
      title={`Delete ${blockName}?`}
      trigger={
        <Button size="sm" variant="danger">
          Delete
        </Button>
      }
    >
      This removes {blockName} from the program by saving a new version without
      it. Workouts you&rsquo;ve already logged stay untouched.
    </ModalDialog>
  );
};
