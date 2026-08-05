"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { Button } from "../ui";

const responseSchema = z.object({ id: z.string() });

/** Starts today's workout: creates the session server-side, then navigates into
 *  the execution screen. */
export const StartWorkoutButton = () => {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  const start = () => {
    setStarting(true);
    fetch("/api/workouts", { method: "POST" })
      .then(async (response) => {
        if (response.ok) {
          const { id } = responseSchema.parse(await response.json());
          router.push(`/workout/${id}`);
        } else {
          throw new Error(`start failed: ${response.status}`);
        }
      })
      .catch((error: unknown) => {
        setStarting(false);
        // biome-ignore lint/suspicious/noConsole: surface a start failure to the user's console
        console.error("Failed to start workout", error);
      });
  };

  return (
    <Button loading={starting} onClick={start} size="xl">
      Start Workout
    </Button>
  );
};
