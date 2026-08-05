"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui";

type Props = {
  connected: boolean;
};

/** Connect the Concept2 Logbook, or trigger a manual import once connected. */
export const Concept2Controls = ({ connected }: Props) => {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  const sync = () => {
    setSyncing(true);
    fetch("/api/concept2/sync", { method: "POST" })
      .then(() => {
        setSyncing(false);
        router.refresh();
      })
      .catch((error: unknown) => {
        setSyncing(false);
        // biome-ignore lint/suspicious/noConsole: surface a sync failure
        console.error("Concept2 sync failed", error);
      });
  };

  return connected ? (
    <Button loading={syncing} onClick={sync} variant="outline">
      Sync Concept2
    </Button>
  ) : (
    <Button href="/api/concept2/authorize" variant="outline">
      Connect Concept2
    </Button>
  );
};
