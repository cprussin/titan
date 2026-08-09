"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Posts a block as the athlete's active position and refreshes the current
 * route on success. Shared by the block-detail action and the per-row list
 * control so both share one request/refresh path. `onSuccess` runs after a
 * successful save (e.g. to close the dialog the action was triggered from).
 */
export const useSelectActiveBlock = (
  versionId: string,
  blockId: string,
  onSuccess?: () => void,
) => {
  const router = useRouter();
  const [selecting, setSelecting] = useState(false);

  const select = () => {
    setSelecting(true);
    fetch("/api/active-program", {
      body: JSON.stringify({ blockId, versionId }),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
      .then((response) => {
        if (response.ok) {
          setSelecting(false);
          onSuccess?.();
          router.refresh();
        } else {
          throw new Error(`select failed: ${response.status}`);
        }
      })
      .catch((error: unknown) => {
        setSelecting(false);
        // biome-ignore lint/suspicious/noConsole: surface a selection failure to the user's console
        console.error("Failed to set active block", error);
      });
  };

  return { select, selecting };
};
