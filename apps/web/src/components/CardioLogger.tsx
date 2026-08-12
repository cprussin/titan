"use client";

import type { NormalizedWorkout } from "@titan/domain/external";
import type { Modality } from "@titan/domain/movement";
import type { ExerciseResult } from "@titan/domain/result";
import type { PrescribedExercise } from "@titan/domain/workout-session";
import { useCallback, useState } from "react";
import { vstack } from "../../styled-system/patterns";
import { buildImportResult } from "../build-import-result";
import { checkConcept2Match } from "../check-concept2-match";
import { formatClock, formatDuration, parseDuration } from "../format";
import type { ScheduleTick } from "../tick-scheduler";
import { Button, Field, Input } from "../ui";
import { Concept2Check } from "./Concept2Check";
import { EffortTimer } from "./EffortTimer";

type CardioLoggerProps = {
  busy: boolean;
  concept2Connected: boolean;
  modality: Modality | undefined;
  onComplete: (result: ExerciseResult) => void;
  prescribed: PrescribedExercise;
  /** Tick scheduler for the piece timer, injected for testing; defaults to a 1s
   *  `setInterval` inside {@link EffortTimer}. */
  schedule?: ScheduleTick;
  sessionId: string;
};

/** Logs a cardio piece — distance, duration, and optional average heart rate —
 *  and, for a connected rower, offers a Concept2 hand-off that imports the
 *  effort instead of typing it. */
export const CardioLogger = ({
  busy,
  concept2Connected,
  modality,
  onComplete,
  prescribed,
  schedule,
  sessionId,
}: CardioLoggerProps) => {
  const [distanceM, setDistanceM] = useState("");
  const [duration, setDuration] = useState("");
  const [avgHr, setAvgHr] = useState("");
  const durationTarget =
    prescribed.prescription.type === "timed-cardio"
      ? prescribed.prescription.durationSec
      : undefined;

  const checkConcept2 = useCallback(
    () => checkConcept2Match(sessionId, prescribed.slotId),
    [prescribed.slotId, sessionId],
  );
  const logImport = useCallback(
    (normalized: NormalizedWorkout) => {
      onComplete(buildImportResult(prescribed, normalized));
    },
    [onComplete, prescribed],
  );

  const complete = () => {
    const distanceMeters = Number(distanceM) || 0;
    const durationSec = parseDuration(duration) ?? 0;
    const heart = Number(avgHr) || 0;
    onComplete({
      cardio: {
        ...(distanceMeters > 0 ? { distanceMeters } : {}),
        ...(durationSec > 0 ? { durationSec } : {}),
        ...(distanceMeters > 0 && durationSec > 0
          ? { splitSecPer500: durationSec / (distanceMeters / 500) }
          : {}),
        ...(heart > 0 ? { avgHr: heart } : {}),
      },
      exerciseId: prescribed.exerciseId,
      id: crypto.randomUUID(),
      prescription: prescribed.prescription,
      sets: [],
      slotId: prescribed.slotId,
    });
  };

  return (
    <div className={vstack({ alignItems: "stretch", gap: 3 })}>
      {modality === "rower" && concept2Connected && (
        <Concept2Check check={checkConcept2} onFound={logImport} />
      )}
      <NumberField
        label="Distance (m)"
        onChange={setDistanceM}
        value={distanceM}
      />
      <DurationField
        label="Duration (m:ss)"
        onChange={setDuration}
        value={duration}
      />
      <EffortTimer
        onUse={(seconds) => setDuration(formatClock(seconds))}
        schedule={schedule}
        targetSeconds={durationTarget}
      />
      <NumberField
        label="Avg HR (optional)"
        onChange={setAvgHr}
        value={avgHr}
      />
      <Button loading={busy} onClick={complete} size="xl" variant="success">
        Complete
      </Button>
    </div>
  );
};

type NumberFieldProps = {
  label: string;
  onChange: (value: string) => void;
  value: string;
};

const NumberField = ({ label, onChange, value }: NumberFieldProps) => (
  <Field label={label}>
    <Input
      inputMode="numeric"
      onChange={(event) => onChange(event.currentTarget.value)}
      type="number"
      value={value}
    />
  </Field>
);

type DurationFieldProps = {
  label: string;
  onChange: (value: string) => void;
  value: string;
};

// A free-text clock entry (`m:ss`, `m:ss.s`, or bare seconds) rather than a
// numeric field, so a rowing piece is logged at its true precision. The parsed
// value is echoed back normalized (as the field's hint) so the athlete sees
// exactly what will be stored.
const DurationField = ({ label, onChange, value }: DurationFieldProps) => {
  const parsed = parseDuration(value);
  return (
    <Field
      hint={parsed === undefined ? undefined : formatDuration(parsed)}
      label={label}
    >
      <Input
        inputMode="text"
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder="m:ss"
        value={value}
      />
    </Field>
  );
};
