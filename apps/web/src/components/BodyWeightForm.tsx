"use client";

import { useRouter } from "next/navigation";
import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { hstack } from "../../styled-system/patterns";
import { Button, Input } from "../ui";

/** Logs today's bodyweight and refreshes the analytics view. */
export const BodyWeightForm = () => {
  const router = useRouter();
  const [weight, setWeight] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const weightLb = Number(weight);
    if (weightLb > 0) {
      setBusy(true);
      fetch("/api/body-metrics", {
        body: JSON.stringify({ weightLb }),
        headers: { "content-type": "application/json" },
        method: "POST",
      })
        .then(() => {
          setWeight("");
          setBusy(false);
          router.refresh();
        })
        .catch((error: unknown) => {
          setBusy(false);
          // biome-ignore lint/suspicious/noConsole: surface a save failure
          console.error("Failed to log bodyweight", error);
        });
    }
  };

  return (
    <form className={hstack({ gap: 2 })} onSubmit={submit}>
      <Input
        aria-label="Bodyweight in pounds"
        inputMode="decimal"
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          setWeight(event.currentTarget.value)
        }
        placeholder="Bodyweight (lb)"
        type="number"
        value={weight}
      />
      <Button loading={busy} type="submit">
        Log
      </Button>
    </form>
  );
};
