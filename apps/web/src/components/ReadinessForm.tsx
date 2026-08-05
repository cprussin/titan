"use client";

import { useRouter } from "next/navigation";
import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { css } from "../../styled-system/css";
import { hstack, vstack } from "../../styled-system/patterns";
import { Button, Input } from "../ui";

const RATINGS = [1, 2, 3, 4, 5] as const;

/** Pre-workout readiness check-in. These values can reduce the day's workload
 *  but never raise intensity (see the spec's "Readiness"). */
export const ReadinessForm = () => {
  const router = useRouter();
  const [energy, setEnergy] = useState(3);
  const [soreness, setSoreness] = useState(3);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [availableMinutes, setAvailableMinutes] = useState(60);
  const [submitting, setSubmitting] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    fetch("/api/readiness", {
      body: JSON.stringify({
        availableMinutes,
        energy,
        sleepQuality,
        soreness,
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    })
      .then(() => {
        router.push("/");
        router.refresh();
      })
      .catch((error: unknown) => {
        setSubmitting(false);
        // biome-ignore lint/suspicious/noConsole: surface a submit failure
        console.error("Failed to save readiness", error);
      });
  };

  return (
    <form className={formStyles} onSubmit={submit}>
      <RatingRow label="Energy" onChange={setEnergy} value={energy} />
      <RatingRow
        label="Soreness (5 = fresh)"
        onChange={setSoreness}
        value={soreness}
      />
      <RatingRow
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
      <Button loading={submitting} size="lg" type="submit">
        Save & continue
      </Button>
    </form>
  );
};

type RatingRowProps = {
  label: string;
  onChange: (value: number) => void;
  value: number;
};

const RatingRow = ({ label, onChange, value }: RatingRowProps) => (
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

const formStyles = vstack({ alignItems: "stretch", gap: 5 });

const fieldStyles = vstack({ alignItems: "stretch", gap: 2 });

const labelStyles = css({ fontSize: "sm", fontWeight: "medium" });

const ratingsStyles = hstack({ gap: 2 });
