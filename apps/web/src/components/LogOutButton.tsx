"use client";

import { SignOutIcon } from "@phosphor-icons/react/dist/ssr/SignOut";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui";

/** Clears the session cookie server-side, then returns to the login screen.
 *  Shared by the sidebar and the settings screen. */
export const LogOutButton = () => {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const logOut = () => {
    setSubmitting(true);
    fetch("/api/auth/logout", { method: "POST" })
      .then(() => {
        router.replace("/login");
        router.refresh();
      })
      .catch((error: unknown) => {
        setSubmitting(false);
        // biome-ignore lint/suspicious/noConsole: surface a logout failure
        console.error("Log out failed", error);
      });
  };

  return (
    <Button
      beforeIcon={<SignOutIcon size={18} />}
      loading={submitting}
      onClick={logOut}
      size="sm"
      variant="outline"
    >
      Log out
    </Button>
  );
};
