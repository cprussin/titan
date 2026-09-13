"use client";

import type { AlternativeChoice } from "../server/workout-action";
import { Field, ToggleGroup } from "../ui";

type Props = {
  alternatives: readonly AlternativeChoice[];
  onChange: (id: string) => void;
  /** The alternative currently chosen — one is always chosen, so the day never
   *  starts without a session. */
  value: string;
};

/**
 * The choice between a day's equivalent sessions (Saturday's Long Easy Cardio:
 * row, trail run, hike, or bike), made when the workout is started. A toggle
 * group rather than a select: there are only ever a handful of options, and on
 * a phone each is a direct tap. The pick lasts for the one session — it is sent
 * with the start request and never written back to the program.
 */
export const SessionAlternativePicker = ({
  alternatives,
  onChange,
  value,
}: Props) => (
  <Field
    hint="Equivalent ways to get the same session in — pick whichever suits today."
    label="Today's session"
  >
    <ToggleGroup
      aria-label="Today's session"
      items={alternatives.map((alternative) => ({
        label: alternative.label,
        value: alternative.id,
      }))}
      onValueChange={([selected]) => {
        // Single-select: `selected` is the tapped alternative, or `undefined`
        // when the pressed one is tapped again — base-ui's clear-on-re-tap,
        // which a mandatory choice has no state to clear to, so it is dropped.
        if (selected !== undefined) {
          onChange(selected);
        }
      }}
      value={[value]}
    />
  </Field>
);
