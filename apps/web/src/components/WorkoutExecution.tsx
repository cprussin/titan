"use client";

import type { Prescription } from "@titan/domain/prescription";
import type { ExerciseResult, SetResult } from "@titan/domain/result";
import type { PrescribedExercise } from "@titan/domain/workout-session";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { css } from "../../styled-system/css";
import { hstack, vstack } from "../../styled-system/patterns";
import { formatWeight } from "../format";
import { describePrescription } from "../prescription-text";
import { Button, Input } from "../ui";
import { CancelWorkoutButton } from "./CancelWorkoutButton";
import { RestTimer } from "./RestTimer";

type Props = {
  exerciseNames: Record<string, string>;
  prescribedExercises: readonly PrescribedExercise[];
  sessionId: string;
};

/** How many working sets a prescription calls for (cardio efforts are one bout). */
const totalSets = (prescription: Prescription): number =>
  prescription.type === "strength" ||
  prescription.type === "bodyweight" ||
  prescription.type === "timed-hold"
    ? prescription.sets
    : 1;

const isStrengthLike = (
  prescription: Prescription,
): prescription is Extract<
  Prescription,
  { type: "strength" | "bodyweight" | "timed-hold" }
> =>
  prescription.type === "strength" ||
  prescription.type === "bodyweight" ||
  prescription.type === "timed-hold";

/**
 * The workout execution screen: guides the athlete through one exercise at a
 * time with prefilled targets (so a set on target is a single tap), a rest timer
 * between sets, and a preview of what's next. Records everything and finalizes
 * the session on the last exercise.
 */
export const WorkoutExecution = ({
  exerciseNames,
  prescribedExercises,
  sessionId,
}: Props) => {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [logged, setLogged] = useState<SetResult[]>([]);
  const [resting, setResting] = useState(false);
  const [busy, setBusy] = useState(false);

  const current = prescribedExercises[index];
  const next = prescribedExercises[index + 1];

  const advance = useCallback(
    (exerciseResult: ExerciseResult) => {
      const nextResults = [...results, exerciseResult];
      const isLast = index + 1 >= prescribedExercises.length;
      setBusy(true);
      persist(sessionId, nextResults, isLast)
        .then(() => {
          if (isLast) {
            router.push(`/workout/${sessionId}/complete`);
          } else {
            setResults(nextResults);
            setLogged([]);
            setResting(false);
            setIndex((value) => value + 1);
            setBusy(false);
          }
        })
        .catch((error: unknown) => {
          setBusy(false);
          // biome-ignore lint/suspicious/noConsole: surface a save failure
          console.error("Failed to save workout progress", error);
        });
    },
    [index, prescribedExercises.length, results, router, sessionId],
  );

  const finishRest = useCallback(() => {
    setResting(false);
  }, []);

  if (current === undefined) {
    return <p className={mutedStyles}>Nothing to do.</p>;
  } else {
    return (
      <div className={rootStyles}>
        <ProgressBar
          current={index}
          segments={prescribedExercises.map((exercise) => exercise.slotId)}
        />
        <div className={bodyStyles}>
          <div className={mainColStyles}>
            <header className={vstack({ alignItems: "flex-start", gap: 1 })}>
              <span className={roleStyles}>{current.role}</span>
              <h1 className={nameStyles}>
                {exerciseNames[current.exerciseId] ?? current.exerciseId}
              </h1>
              <p className={targetStyles}>
                {describePrescription(current.prescription)}
              </p>
            </header>

            <PreviousPerformance previous={current.previous} />

            {resting ? (
              <RestTimer
                initialSeconds={restSeconds(current)}
                onFinish={finishRest}
              />
            ) : (
              <ExerciseLogger
                busy={busy}
                logged={logged}
                onComplete={advance}
                onLogSet={(set) => {
                  const nowLogged = [...logged, set];
                  setLogged(nowLogged);
                  if (nowLogged.length < totalSets(current.prescription)) {
                    setResting(true);
                  }
                }}
                prescribed={current}
              />
            )}

            {/* On phones the "up next" hint and cancel ride under the logger;
                on desktop they move into the outline pane at the side. */}
            {next !== undefined && (
              <p className={nextStyles}>
                Next: {exerciseNames[next.exerciseId] ?? next.exerciseId} ·{" "}
                {describePrescription(next.prescription)}
              </p>
            )}

            <div className={cancelStyles}>
              <CancelWorkoutButton sessionId={sessionId} />
            </div>
          </div>

          <aside className={asideStyles}>
            <SessionOutline
              currentIndex={index}
              exerciseNames={exerciseNames}
              prescribedExercises={prescribedExercises}
            />
            <CancelWorkoutButton sessionId={sessionId} />
          </aside>
        </div>
      </div>
    );
  }
};

/**
 * The full session at a glance — every exercise with the current one
 * highlighted, done ones dimmed, upcoming ones muted. Shown in the desktop
 * side pane where there's room for standing context; on phones the compact
 * "Next:" line stands in for it instead.
 */
const SessionOutline = ({
  currentIndex,
  exerciseNames,
  prescribedExercises,
}: {
  currentIndex: number;
  exerciseNames: Record<string, string>;
  prescribedExercises: readonly PrescribedExercise[];
}) => (
  <div className={outlineStyles}>
    <span className={outlineTitleStyles}>Session</span>
    <ol className={outlineListStyles}>
      {prescribedExercises.map((exercise, position) => (
        <li
          className={outlineRowStyles}
          data-state={outlineState(position, currentIndex)}
          key={exercise.slotId}
        >
          <span className={outlineBadgeStyles}>{position + 1}</span>
          <span className={outlineTextStyles}>
            <span className={outlineNameStyles}>
              {exerciseNames[exercise.exerciseId] ?? exercise.exerciseId}
            </span>
            <span className={outlineTargetStyles}>
              {describePrescription(exercise.prescription)}
            </span>
          </span>
        </li>
      ))}
    </ol>
  </div>
);

/** Where an exercise sits relative to the one in progress, for outline styling. */
const outlineState = (
  position: number,
  currentIndex: number,
): "current" | "done" | "upcoming" => {
  switch (Math.sign(position - currentIndex)) {
    case -1: {
      return "done";
    }
    case 0: {
      return "current";
    }
    default: {
      return "upcoming";
    }
  }
};

type LoggerProps = {
  busy: boolean;
  logged: readonly SetResult[];
  onComplete: (result: ExerciseResult) => void;
  onLogSet: (set: SetResult) => void;
  prescribed: PrescribedExercise;
};

const ExerciseLogger = ({
  busy,
  logged,
  onComplete,
  onLogSet,
  prescribed,
}: LoggerProps) => {
  const { prescription } = prescribed;
  return isStrengthLike(prescription) ? (
    <StrengthLogger
      busy={busy}
      logged={logged}
      onComplete={onComplete}
      onLogSet={onLogSet}
      prescribed={prescribed}
      prescription={prescription}
    />
  ) : (
    <CardioLogger busy={busy} onComplete={onComplete} prescribed={prescribed} />
  );
};

type StrengthLoggerProps = LoggerProps & {
  prescription: Extract<
    Prescription,
    { type: "strength" | "bodyweight" | "timed-hold" }
  >;
};

const StrengthLogger = ({
  busy,
  logged,
  onComplete,
  onLogSet,
  prescribed,
  prescription,
}: StrengthLoggerProps) => {
  const sets = prescription.sets;
  const done = logged.length;
  const [weight, setWeight] = useState(defaultWeight(prescription));
  const [reps, setReps] = useState(defaultReps(prescription));
  const [holdSec, setHoldSec] = useState(
    prescription.type === "timed-hold" ? prescription.holdSec : 0,
  );
  const [rpe, setRpe] = useState<number | undefined>(undefined);

  const logSet = () => {
    onLogSet({
      completed: true,
      setIndex: done,
      ...(prescription.type === "timed-hold"
        ? { holdSec }
        : { reps, weightLb: weight }),
      ...(rpe === undefined ? {} : { rpe }),
    });
    setRpe(undefined);
  };

  const complete = () => {
    onComplete({
      exerciseId: prescribed.exerciseId,
      id: crypto.randomUUID(),
      prescription,
      sets: [...logged],
      slotId: prescribed.slotId,
    });
  };

  return (
    <div className={vstack({ alignItems: "stretch", gap: 3 })}>
      <p className={setCountStyles}>
        {done >= sets ? "All sets logged" : `Set ${done + 1} of ${sets}`}
      </p>
      {done < sets && (
        <div className={vstack({ alignItems: "stretch", gap: 3 })}>
          {prescription.type === "timed-hold" ? (
            <Stepper
              label="Hold (sec)"
              onChange={setHoldSec}
              step={5}
              value={holdSec}
            />
          ) : (
            <>
              {prescription.type === "strength" && (
                <Stepper
                  label="Weight (lb)"
                  onChange={setWeight}
                  step={5}
                  value={weight}
                />
              )}
              <Stepper label="Reps" onChange={setReps} step={1} value={reps} />
            </>
          )}
          <RpePicker onChange={setRpe} value={rpe} />
          <Button onClick={logSet} size="xl">
            Log set
          </Button>
        </div>
      )}
      <Button
        disabled={done === 0}
        loading={busy}
        onClick={complete}
        size="lg"
        variant={done >= sets ? "solid" : "outline"}
      >
        {done >= sets ? "Complete exercise" : "Finish early"}
      </Button>
    </div>
  );
};

type CardioLoggerProps = {
  busy: boolean;
  onComplete: (result: ExerciseResult) => void;
  prescribed: PrescribedExercise;
};

const CardioLogger = ({ busy, onComplete, prescribed }: CardioLoggerProps) => {
  const [distanceM, setDistanceM] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [avgHr, setAvgHr] = useState("");

  const complete = () => {
    const distanceMeters = Number(distanceM) || 0;
    const durationSec = (Number(durationMin) || 0) * 60;
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
      <NumberField
        label="Distance (m)"
        onChange={setDistanceM}
        value={distanceM}
      />
      <NumberField
        label="Duration (min)"
        onChange={setDurationMin}
        value={durationMin}
      />
      <NumberField
        label="Avg HR (optional)"
        onChange={setAvgHr}
        value={avgHr}
      />
      <Button loading={busy} onClick={complete} size="xl">
        Complete
      </Button>
    </div>
  );
};

type StepperProps = {
  label: string;
  onChange: (value: number) => void;
  step: number;
  value: number;
};

const Stepper = ({ label, onChange, step, value }: StepperProps) => (
  <div className={vstack({ alignItems: "stretch", gap: 1 })}>
    <span className={fieldLabelStyles}>{label}</span>
    <div className={hstack({ gap: 2, justifyContent: "space-between" })}>
      <Button
        label={`Decrease ${label}`}
        onClick={() => onChange(Math.max(0, value - step))}
        size="lg"
        variant="outline"
      >
        −
      </Button>
      <span className={stepperValueStyles}>{value}</span>
      <Button
        label={`Increase ${label}`}
        onClick={() => onChange(value + step)}
        size="lg"
        variant="outline"
      >
        +
      </Button>
    </div>
  </div>
);

const RPE_OPTIONS = [7, 8, 9, 10] as const;

type RpePickerProps = {
  onChange: (value: number | undefined) => void;
  value: number | undefined;
};

const RpePicker = ({ onChange, value }: RpePickerProps) => (
  <div className={vstack({ alignItems: "stretch", gap: 1 })}>
    <span className={fieldLabelStyles}>RPE (optional)</span>
    <div className={hstack({ gap: 2 })}>
      {RPE_OPTIONS.map((option) => (
        <Button
          key={option}
          onClick={() => onChange(option === value ? undefined : option)}
          size="md"
          variant={option === value ? "accent" : "outline"}
        >
          {`${option}`}
        </Button>
      ))}
    </div>
  </div>
);

type NumberFieldProps = {
  label: string;
  onChange: (value: string) => void;
  value: string;
};

const NumberField = ({ label, onChange, value }: NumberFieldProps) => (
  <div className={vstack({ alignItems: "stretch", gap: 1 })}>
    <span className={fieldLabelStyles}>{label}</span>
    <Input
      aria-label={label}
      inputMode="numeric"
      onChange={(event) => onChange(event.currentTarget.value)}
      type="number"
      value={value}
    />
  </div>
);

const PreviousPerformance = ({
  previous,
}: {
  previous: ExerciseResult | undefined;
}) => {
  const best = previous === undefined ? undefined : topSet(previous);
  return best === undefined ? undefined : (
    <p className={previousStyles}>
      Last time: {best.reps === undefined ? "" : `${best.reps} × `}
      {best.weightLb === undefined ? "" : formatWeight(best.weightLb)}
    </p>
  );
};

const ProgressBar = ({
  current,
  segments,
}: {
  current: number;
  segments: readonly string[];
}) => (
  <div className={progressTrackStyles}>
    {segments.map((id, position) => (
      <span
        className={css({
          backgroundColor: position <= current ? "accent" : "border",
          blockSize: 1,
          borderRadius: "full",
          flex: 1,
        })}
        key={id}
      />
    ))}
  </div>
);

const persist = async (
  sessionId: string,
  results: readonly ExerciseResult[],
  complete: boolean,
): Promise<void> => {
  const response = await fetch(`/api/workouts/${sessionId}`, {
    body: JSON.stringify({ complete, results }),
    headers: { "content-type": "application/json" },
    method: "PATCH",
  });
  if (!response.ok) {
    throw new Error(`save failed: ${response.status}`);
  }
};

const topSet = (result: ExerciseResult): SetResult | undefined =>
  result.sets.reduce<SetResult | undefined>(
    (best, set) =>
      best === undefined || (set.weightLb ?? 0) > (best.weightLb ?? 0)
        ? set
        : best,
    undefined,
  );

const restSeconds = (prescribed: PrescribedExercise): number =>
  prescribed.role === "primary" ? 150 : 90;

const defaultWeight = (prescription: Prescription): number =>
  prescription.type === "strength" ? prescription.weightLb : 0;

const defaultReps = (prescription: Prescription): number =>
  prescription.type === "strength" || prescription.type === "bodyweight"
    ? prescription.reps
    : 0;

// The active exercise stays a focused single column on phones; on desktop it
// pairs with a standing session outline, so the root widens to hold both.
const rootStyles = vstack({
  alignItems: "stretch",
  gap: 4,
  inlineSize: "100%",
  lg: { maxInlineSize: "none" },
  marginInline: "auto",
  maxInlineSize: "32rem",
});

// One column on phones (outline hidden); a wide work area beside a narrower
// outline rail on desktop.
const bodyStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: 4,
  lg: {
    alignItems: "start",
    display: "grid",
    gap: 8,
    gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)",
  },
});

const mainColStyles = vstack({
  alignItems: "stretch",
  gap: 4,
});

// The outline pane: hidden on phones, and on desktop it sticks in view while
// the work area scrolls through sets.
const asideStyles = css({
  display: "none",
  lg: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    insetBlockStart: 8,
    position: "sticky",
  },
});

const outlineStyles = vstack({
  alignItems: "stretch",
  backgroundColor: "card",
  border: "1px solid {colors.border}",
  borderRadius: "xl",
  gap: 3,
  padding: 4,
});

const outlineTitleStyles = css({
  color: "muted",
  fontSize: "xs",
  fontWeight: "semibold",
  letterSpacing: "wide",
  textTransform: "uppercase",
});

const outlineListStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: 2.5,
  listStyleType: "none",
  margin: 0,
  padding: 0,
});

const outlineRowStyles = css({
  "&[data-state='current']": { color: "accent" },
  "&[data-state='done']": { color: "textTertiary" },
  alignItems: "baseline",
  color: "muted",
  display: "flex",
  gap: 2.5,
});

const outlineBadgeStyles = css({
  fontFamily: "mono",
  fontSize: "xs",
  fontWeight: "bold",
  minInlineSize: 4,
  textAlign: "end",
});

const outlineTextStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: 0.5,
  minInlineSize: 0,
});

const outlineNameStyles = css({ fontSize: "sm", fontWeight: "medium" });

const outlineTargetStyles = css({ color: "textTertiary", fontSize: "xs" });

const nameStyles = css({ fontSize: "3xl", fontWeight: "bold" });

const roleStyles = css({
  color: "accent",
  fontSize: "xs",
  fontWeight: "semibold",
  textTransform: "uppercase",
});

const targetStyles = css({ color: "muted", fontSize: "lg" });

const setCountStyles = css({
  color: "muted",
  fontSize: "sm",
  fontWeight: "medium",
});

const fieldLabelStyles = css({ color: "muted", fontSize: "sm" });

const stepperValueStyles = css({
  fontFamily: "mono",
  fontSize: "4xl",
  fontWeight: "bold",
});

const previousStyles = css({
  backgroundColor: "card",
  borderRadius: "md",
  color: "muted",
  fontSize: "sm",
  paddingBlock: 2,
  paddingInline: 3,
});

const nextStyles = css({
  color: "textTertiary",
  fontSize: "sm",
  lg: { display: "none" },
  textAlign: "center",
});

const mutedStyles = css({ color: "muted" });

const progressTrackStyles = hstack({ gap: 1 });

const cancelStyles = css({
  lg: { display: "none" },
  marginBlockStart: 2,
  textAlign: "center",
});
