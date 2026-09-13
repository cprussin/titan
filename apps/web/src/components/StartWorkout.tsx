"use client";

import { PlayIcon } from "@phosphor-icons/react/dist/ssr/Play";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import type { AlternativeChoice } from "../server/workout-action";
import { Button, ModalDialog } from "../ui";
import { ReadinessCheckIn } from "./ReadinessCheckIn";
import { SessionAlternativePicker } from "./SessionAlternativePicker";

const responseSchema = z.object({ id: z.string() });

type Props = {
  /** The equivalent sessions today offers a choice between, empty for a day
   *  with one fixed session. */
  alternatives: readonly AlternativeChoice[];
  /** Pill the trigger for the mobile FAB; leave square for the sidebar. */
  rounded: boolean;
  /** Trigger height — `xl` for the prominent mobile FAB, `lg` inline. */
  size?: "lg" | "xl" | undefined;
  /** Render the trigger as an icon-only circle for the mobile FAB stack, its
   *  name carried by `aria-label` with the visible label sitting beside it. */
  iconOnly?: boolean | undefined;
};

/**
 * Starts today's workout behind a quick, skippable readiness check-in. Filling
 * it in records the check-in for the day (which the new session links to);
 * skipping starts straight away. Either path creates the session server-side
 * and navigates into it.
 *
 * On a day whose session is a choice between equivalent alternatives, the
 * check-in leads with that choice — the first is preselected, so skipping
 * straight past it still starts a real session. The pick rides along with the
 * start request and applies to that session only; the program is untouched.
 */
export const StartWorkout = ({
  alternatives,
  rounded,
  size = "lg",
  iconOnly = false,
}: Props) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [alternativeId, setAlternativeId] = useState(alternatives[0]?.id);
  const [energy, setEnergy] = useState(3);
  const [soreness, setSoreness] = useState(3);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [availableMinutes, setAvailableMinutes] = useState(60);
  const [busy, setBusy] = useState(false);

  const begin = (withReadiness: boolean) => {
    setBusy(true);
    const readied = withReadiness
      ? fetch("/api/readiness", {
          body: JSON.stringify({
            availableMinutes,
            energy,
            sleepQuality,
            soreness,
          }),
          headers: { "content-type": "application/json" },
          method: "POST",
        }).then((response) => {
          if (response.ok) {
            return undefined;
          } else {
            throw new Error(`readiness failed: ${response.status}`);
          }
        })
      : Promise.resolve(undefined);
    readied
      .then(() =>
        fetch("/api/workouts", {
          body: JSON.stringify(
            alternativeId === undefined ? {} : { alternativeId },
          ),
          headers: { "content-type": "application/json" },
          method: "POST",
        }),
      )
      .then(async (response) => {
        if (response.ok) {
          const { id } = responseSchema.parse(await response.json());
          router.push(`/workout/${id}`);
          // Refresh so the app-wide action (resolved in the persistent (app)
          // layout) reflects the now in-progress session instead of staying
          // "Start workout" until a full reload.
          router.refresh();
        } else {
          throw new Error(`start failed: ${response.status}`);
        }
      })
      .catch((error: unknown) => {
        setBusy(false);
        // biome-ignore lint/suspicious/noConsole: surface a start failure to the user's console
        console.error("Failed to start workout", error);
      });
  };

  return (
    <ModalDialog
      footer={
        <>
          <Button loading={busy} onClick={() => begin(false)} variant="ghost">
            Skip
          </Button>
          <Button loading={busy} onClick={() => begin(true)} variant="accent">
            Start workout
          </Button>
        </>
      }
      onOpenChange={setOpen}
      open={open}
      title="Ready to train?"
      trigger={
        iconOnly ? (
          <Button
            label="Start workout"
            rounded={rounded}
            size={size}
            variant="accent"
          >
            <PlayIcon size={20} />
          </Button>
        ) : (
          <Button
            beforeIcon={<PlayIcon size={20} />}
            rounded={rounded}
            size={size}
            variant="accent"
          >
            Start workout
          </Button>
        )
      }
    >
      {alternativeId !== undefined && (
        <SessionAlternativePicker
          alternatives={alternatives}
          onChange={setAlternativeId}
          value={alternativeId}
        />
      )}
      <ReadinessCheckIn
        availableMinutes={availableMinutes}
        energy={energy}
        onAvailableMinutesChange={setAvailableMinutes}
        onEnergyChange={setEnergy}
        onSleepQualityChange={setSleepQuality}
        onSorenessChange={setSoreness}
        sleepQuality={sleepQuality}
        soreness={soreness}
      />
    </ModalDialog>
  );
};
