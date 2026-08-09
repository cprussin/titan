"use client";

import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ModalDialog } from "../ui";

type Props = {
  programId: string;
  programName: string;
};

/** Deletes a program after a confirmation prompt, then refreshes so it drops off
 *  the index. The server preserves history: a program with logged workouts is
 *  archived rather than erased, so this always keeps the athlete's record. */
export const DeleteProgramButton = ({ programId, programName }: Props) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const deleteProgram = () => {
    setDeleting(true);
    fetch(`/api/programs/${programId}`, { method: "DELETE" })
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
        console.error("Failed to delete program", error);
      });
  };

  return (
    <ModalDialog
      footer={
        <>
          <ModalDialog.CloseButton variant="ghost">
            Keep program
          </ModalDialog.CloseButton>
          <Button loading={deleting} onClick={deleteProgram} variant="danger">
            Delete program
          </Button>
        </>
      }
      onOpenChange={setOpen}
      open={open}
      title={`Delete ${programName}?`}
      trigger={
        <Button label={`Delete ${programName}`} size="sm" variant="ghost">
          <TrashIcon />
        </Button>
      }
    >
      This removes {programName} from your programs. Workouts you&rsquo;ve
      already logged from it are kept.
    </ModalDialog>
  );
};
