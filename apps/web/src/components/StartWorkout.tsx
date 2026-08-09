"use client";

import { PlayIcon } from "@phosphor-icons/react/dist/ssr/Play";
import { useRouter } from "next/navigation";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { z } from "zod";
import { css } from "../../styled-system/css";
import { hstack, vstack } from "../../styled-system/patterns";
import { Button, Input, ModalDialog } from "../ui";

const responseSchema = z.object({ id: z.string() });

const RATINGS = [1, 2, 3, 4, 5] as const;

type Props = {
  /** Pill the trigger for the mobile FAB; leave square for the sidebar. */
  rounded: boolean;
  /** Trigger height — `xl` for the prominent mobile FAB, `lg` inline. */
  size?: "lg" | "xl" | undefined;
};

/**
 * Starts today's workout behind a quick, skippable readiness check-in. Filling
 * it in records the check-in for the day (which the new session links to);
 * skipping starts straight away. Either path creates the session server-side
 * and navigates into it.
 */
export const StartWorkout = ({ rounded, size = "lg" }: Props) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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
      .then(() => fetch("/api/workouts", { method: "POST" }))
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
        <Button
          beforeIcon={<PlayIcon size={20} />}
          rounded={rounded}
          size={size}
          variant="accent"
        >
          Start workout
        </Button>
      }
    >
      <div className={fieldsStyles}>
        <p className={introStyles}>
          A quick pre-workout check-in, recorded with today&rsquo;s session.
          Skip to start right away.
        </p>
        <Rating label="Energy" onChange={setEnergy} value={energy} />
        <Rating
          label="Soreness (5 = fresh)"
          onChange={setSoreness}
          value={soreness}
        />
        <Rating
          label="Sleep quality"
          onChange={setSleepQuality}
          value={sleepQuality}
        />
        <div className={fieldStyles}>
          <span className={labelStyles}>Available time (min)</span>
          <Input
            aria-label="Available time in minutes"
            inputMode="numeric"
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setAvailableMinutes(Number(event.currentTarget.value) || 0)
            }
            type="number"
            value={`${availableMinutes}`}
          />
        </div>
      </div>
    </ModalDialog>
  );
};

type RatingProps = {
  label: string;
  onChange: (value: number) => void;
  value: number;
};

const Rating = ({ label, onChange, value }: RatingProps) => (
  <div className={fieldStyles}>
    <span className={labelStyles}>{label}</span>
    <div className={ratingsStyles}>
      {RATINGS.map((rating) => (
        <Button
          key={rating}
          onClick={() => onChange(rating)}
          size="md"
          variant={rating === value ? "accent" : "outline"}
        >
          {`${rating}`}
        </Button>
      ))}
    </div>
  </div>
);

const fieldsStyles = vstack({ alignItems: "stretch", gap: 4 });

const introStyles = css({ color: "muted", fontSize: "sm" });

const fieldStyles = vstack({ alignItems: "stretch", gap: 2 });

const labelStyles = css({ fontSize: "sm", fontWeight: "medium" });

const ratingsStyles = hstack({ gap: 2 });
