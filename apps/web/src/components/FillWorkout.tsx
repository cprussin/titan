"use client";

import { ClockCounterClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import type { AlternativeChoice } from "../server/workout-action";
import { Button, ModalDialog } from "../ui";
import { SessionAlternativePicker } from "./SessionAlternativePicker";

const responseSchema = z.object({ id: z.string() });

type FillRequest = {
  alternativeId?: string;
  date: string;
};

/** Start a session for a missed past day, returning its id. Parsed at the
 *  boundary (DATA.md); throws on a failed start so the caller surfaces it. */
const postFill = async (request: FillRequest): Promise<string> => {
  const response = await fetch("/api/workouts", {
    body: JSON.stringify(request),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`fill failed: ${response.status}`);
  }
  return responseSchema.parse(await response.json()).id;
};

type Props = {
  /** The equivalent sessions the day offers a choice between, empty for a day
   *  with one fixed session. */
  alternatives: readonly AlternativeChoice[];
  /** The missed day the session is dated to. */
  date: string;
  /** Starts the session; injected in tests. */
  startFill?: typeof postFill;
};

/**
 * Logs a missed past day's workout after the fact. Confirming starts a session
 * dated to that day — prescribed as the dashboard showed it — and opens it to
 * log set by set like any other. There is no readiness check-in: it describes
 * how the athlete feels now, not on the missed day.
 */
export const FillWorkout = ({
  alternatives,
  date,
  startFill = postFill,
}: Props) => {
  const router = useRouter();
  const [alternativeId, setAlternativeId] = useState(alternatives[0]?.id);
  const [busy, setBusy] = useState(false);

  const fill = () => {
    setBusy(true);
    startFill(alternativeId === undefined ? { date } : { alternativeId, date })
      .then((id) => {
        router.push(`/workout/${id}`);
        router.refresh();
      })
      .catch((error: unknown) => {
        setBusy(false);
        // biome-ignore lint/suspicious/noConsole: surface a fill failure to the user's console
        console.error("Failed to log missed workout", error);
      });
  };

  return (
    <ModalDialog
      footer={
        <>
          <ModalDialog.CloseButton variant="ghost">
            Cancel
          </ModalDialog.CloseButton>
          <Button loading={busy} onClick={fill} variant="accent">
            Start logging
          </Button>
        </>
      }
      title="Log missed workout?"
      trigger={
        <Button
          beforeIcon={<ClockCounterClockwiseIcon size={20} />}
          size="xl"
          variant="accent"
        >
          Log workout
        </Button>
      }
    >
      {alternativeId !== undefined && (
        <SessionAlternativePicker
          alternatives={alternatives}
          onChange={setAlternativeId}
          value={alternativeId}
        />
      )}
      Record this session as done on its scheduled day. Its loads count toward
      your progression like any other.
    </ModalDialog>
  );
};
