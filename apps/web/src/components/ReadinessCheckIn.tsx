"use client";

import type { ChangeEvent } from "react";
import { css } from "../../styled-system/css";
import { hstack, vstack } from "../../styled-system/patterns";
import { Button, Field, Input } from "../ui";

const RATINGS = [1, 2, 3, 4, 5] as const;

type Props = {
  availableMinutes: number;
  energy: number;
  onAvailableMinutesChange: (value: number) => void;
  onEnergyChange: (value: number) => void;
  onSleepQualityChange: (value: number) => void;
  onSorenessChange: (value: number) => void;
  sleepQuality: number;
  soreness: number;
};

/**
 * The skippable pre-workout readiness check-in: three 1–5 ratings and the
 * minutes available, recorded with today's session. Each control is a `Field`
 * so the labels read consistently with the rest of the app's forms.
 */
export const ReadinessCheckIn = ({
  availableMinutes,
  energy,
  onAvailableMinutesChange,
  onEnergyChange,
  onSleepQualityChange,
  onSorenessChange,
  sleepQuality,
  soreness,
}: Props) => (
  <div className={fieldsStyles}>
    <p className={introStyles}>
      A quick pre-workout check-in, recorded with today&rsquo;s session. Skip to
      start right away.
    </p>
    <Rating label="Energy" onChange={onEnergyChange} value={energy} />
    <Rating
      label="Soreness (5 = fresh)"
      onChange={onSorenessChange}
      value={soreness}
    />
    <Rating
      label="Sleep quality"
      onChange={onSleepQualityChange}
      value={sleepQuality}
    />
    <Field label="Available time (min)">
      <Input
        inputMode="numeric"
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onAvailableMinutesChange(Number(event.currentTarget.value) || 0)
        }
        type="number"
        value={`${availableMinutes}`}
      />
    </Field>
  </div>
);

type RatingProps = {
  label: string;
  onChange: (value: number) => void;
  value: number;
};

const Rating = ({ label, onChange, value }: RatingProps) => (
  <Field label={label}>
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
  </Field>
);

const fieldsStyles = vstack({ alignItems: "stretch", gap: 4 });

const introStyles = css({ color: "muted", fontSize: "sm" });

const ratingsStyles = hstack({ gap: 2 });
