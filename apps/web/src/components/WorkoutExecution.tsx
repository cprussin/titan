"use client";

import { BarbellIcon } from "@phosphor-icons/react/dist/ssr/Barbell";
import { MinusIcon } from "@phosphor-icons/react/dist/ssr/Minus";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import type { NormalizedWorkout } from "@titan/domain/external";
import type { LoadUnit } from "@titan/domain/load-unit";
import { loadStep } from "@titan/domain/load-unit";
import type { Modality } from "@titan/domain/movement";
import type { Prescription } from "@titan/domain/prescription";
import type { ExerciseResult, SetResult } from "@titan/domain/result";
import type { PrescribedExercise } from "@titan/domain/workout-session";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { css } from "../../styled-system/css";
import { hstack, vstack } from "../../styled-system/patterns";
import { buildImportResult } from "../build-import-result";
import { checkConcept2Match } from "../check-concept2-match";
import { formatDuration, formatWeight, parseDuration } from "../format";
import { describePrescription } from "../prescription-text";
import { roleTone } from "../role-tone";
import { Badge, Button, Input } from "../ui";
import { CancelWorkoutButton } from "./CancelWorkoutButton";
import { Concept2Check } from "./Concept2Check";
import { PrescriptionTarget } from "./PrescriptionTarget";
import { RestTimer } from "./RestTimer";
import { TopBar } from "./TopBar";

type Props = {
  /** Whether the athlete's Concept2 Logbook is connected, gating the rowing
   *  hand-off (no point offering it when there's nothing to sync). */
  concept2Connected: boolean;
  /** Modality per exercise id, so a rowing piece (the `rower` modality) can
   *  offer the Concept2 check while other cardio does not. */
  exerciseModalities: Record<string, Modality>;
  exerciseNames: Record<string, string>;
  /** The adaptation explanation for each exercise, keyed by exercise id — why
   *  today's target is what it is. Surfaced as a quiet aside during execution.
   *  Sourced from the session's stored adaptation decisions (not the domain
   *  {@link PrescribedExercise}, which is persisted verbatim). */
  explanations: Record<string, string>;
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
  concept2Connected,
  exerciseModalities,
  exerciseNames,
  explanations,
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
            // Refresh so the app-wide workout action (resolved in the
            // persistent (app) layout) drops the now-completed session rather
            // than lingering as "Continue workout".
            router.refresh();
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
        <TopBar
          actions={<CancelWorkoutButton sessionId={sessionId} size="sm" />}
          icon={<BarbellIcon size={18} />}
          title="Current Workout"
        />
        <ProgressBar
          current={index}
          segments={prescribedExercises.map((exercise) => exercise.slotId)}
        />
        <div className={bodyStyles}>
          <div className={mainColStyles}>
            <header className={vstack({ alignItems: "flex-start", gap: 2 })}>
              <Badge tone={roleTone(current.role)}>{current.role}</Badge>
              <h1 className={nameStyles}>
                {exerciseNames[current.exerciseId] ?? current.exerciseId}
              </h1>
              <PrescriptionTarget
                prescription={current.prescription}
                size="lg"
              />
            </header>

            <PreviousPerformance previous={current.previous} />

            <AdaptationNote explanation={explanations[current.exerciseId]} />

            {resting ? (
              <RestTimer
                initialSeconds={restSeconds(current)}
                onFinish={finishRest}
              />
            ) : (
              <ExerciseLogger
                busy={busy}
                concept2Connected={concept2Connected}
                logged={logged}
                modality={exerciseModalities[current.exerciseId]}
                onComplete={advance}
                onLogSet={(set) => {
                  const nowLogged = [...logged, set];
                  setLogged(nowLogged);
                  if (nowLogged.length < totalSets(current.prescription)) {
                    setResting(true);
                  }
                }}
                prescribed={current}
                sessionId={sessionId}
              />
            )}

            {/* The "up next" hint stands in for the outline on phones. */}
            {next !== undefined && (
              <p className={nextStyles}>
                Next: {exerciseNames[next.exerciseId] ?? next.exerciseId} ·{" "}
                {describePrescription(next.prescription)}
              </p>
            )}
          </div>

          <aside className={asideStyles}>
            <SessionOutline
              currentIndex={index}
              exerciseNames={exerciseNames}
              prescribedExercises={prescribedExercises}
            />
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

/** Cardio pieces additionally need the Concept2 wiring; strength pieces ignore
 *  it, so it lives here rather than on the shared {@link LoggerProps}. */
type ExerciseLoggerProps = LoggerProps & {
  concept2Connected: boolean;
  modality: Modality | undefined;
  sessionId: string;
};

const ExerciseLogger = ({
  busy,
  concept2Connected,
  logged,
  modality,
  onComplete,
  onLogSet,
  prescribed,
  sessionId,
}: ExerciseLoggerProps) => {
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
    <CardioLogger
      busy={busy}
      concept2Connected={concept2Connected}
      modality={modality}
      onComplete={onComplete}
      prescribed={prescribed}
      sessionId={sessionId}
    />
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
      ...(prescription.type === "timed-hold" ? { holdSec } : { reps, weight }),
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
                  label={`Weight (${prescription.unit})`}
                  onChange={setWeight}
                  step={loadStep(prescription.unit)}
                  value={weight}
                />
              )}
              <Stepper label="Reps" onChange={setReps} step={1} value={reps} />
            </>
          )}
          <RpePicker onChange={setRpe} value={rpe} />
        </div>
      )}
      {/* The log and finish actions stack on phones and share a row on
          desktop, where there's width for both. */}
      <div className={actionRowStyles}>
        {done < sets && (
          <Button onClick={logSet} size="lg" variant="accent">
            Log set
          </Button>
        )}
        <Button
          disabled={done === 0}
          loading={busy}
          onClick={complete}
          size="lg"
          variant={done >= sets ? "success" : "outline"}
        >
          {done >= sets ? "Complete exercise" : "Finish early"}
        </Button>
      </div>
    </div>
  );
};

type CardioLoggerProps = {
  busy: boolean;
  concept2Connected: boolean;
  modality: Modality | undefined;
  onComplete: (result: ExerciseResult) => void;
  prescribed: PrescribedExercise;
  sessionId: string;
};

const CardioLogger = ({
  busy,
  concept2Connected,
  modality,
  onComplete,
  prescribed,
  sessionId,
}: CardioLoggerProps) => {
  const [distanceM, setDistanceM] = useState("");
  const [duration, setDuration] = useState("");
  const [avgHr, setAvgHr] = useState("");

  const checkConcept2 = useCallback(
    () => checkConcept2Match(sessionId),
    [sessionId],
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
        <MinusIcon size={18} />
      </Button>
      <span className={stepperValueStyles}>{value}</span>
      <Button
        label={`Increase ${label}`}
        onClick={() => onChange(value + step)}
        size="lg"
        variant="outline"
      >
        <PlusIcon size={18} />
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

type DurationFieldProps = {
  label: string;
  onChange: (value: string) => void;
  value: string;
};

// A free-text clock entry (`m:ss`, `m:ss.s`, or bare seconds) rather than a
// numeric field, so a rowing piece is logged at its true precision. The parsed
// value is echoed back normalized so the athlete sees exactly what will be
// stored.
const DurationField = ({ label, onChange, value }: DurationFieldProps) => {
  const parsed = parseDuration(value);
  return (
    <div className={vstack({ alignItems: "stretch", gap: 1 })}>
      <span className={fieldLabelStyles}>{label}</span>
      <Input
        aria-label={label}
        inputMode="text"
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder="m:ss"
        value={value}
      />
      {parsed !== undefined && (
        <span className={durationEchoStyles}>{formatDuration(parsed)}</span>
      )}
    </div>
  );
};

const PreviousPerformance = ({
  previous,
}: {
  previous: ExerciseResult | undefined;
}) => {
  const best = previous === undefined ? undefined : topSet(previous);
  return best === undefined ? undefined : (
    <p className={previousStyles}>
      Last time: {best.reps === undefined ? "" : `${best.reps} × `}
      {best.weight === undefined
        ? ""
        : formatWeight(best.weight, resultUnit(previous))}
    </p>
  );
};

/** The load unit a recorded exercise was logged in — its snapshot prescription
 *  carries it for strength work; everything else is pounds. */
const resultUnit = (result: ExerciseResult | undefined): LoadUnit =>
  result?.prescription.type === "strength" ? result.prescription.unit : "lb";

// The engine's reason for today's target, one step dimmer than "Last time":
// a hairline `border` rule (not accent) and tertiary text, so it reads as a
// quiet aside rather than an alert.
const AdaptationNote = ({
  explanation,
}: {
  explanation: string | undefined;
}) =>
  explanation === undefined ? undefined : (
    <p className={adaptationStyles}>{explanation}</p>
  );

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
      best === undefined || (set.weight ?? 0) > (best.weight ?? 0) ? set : best,
    undefined,
  );

const restSeconds = (prescribed: PrescribedExercise): number =>
  prescribed.role === "primary" ? 150 : 90;

const defaultWeight = (prescription: Prescription): number =>
  prescription.type === "strength" ? prescription.weight : 0;

const defaultReps = (prescription: Prescription): number =>
  prescription.type === "strength" || prescription.type === "bodyweight"
    ? prescription.reps
    : 0;

// Fills the shared content width like every other page; on desktop it splits
// into the work area plus a standing session outline.
const rootStyles = vstack({ alignItems: "stretch", gap: 4 });

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

// Flat: no card around the outline — a ruled "Session" heading over the list.
const outlineStyles = vstack({ alignItems: "stretch", gap: 3 });

const outlineTitleStyles = css({
  borderBlockEnd:
    "1px solid color-mix(in oklab, {colors.accent} 35%, {colors.border})",
  color: "muted",
  fontSize: "xs",
  fontWeight: "semibold",
  letterSpacing: "wide",
  paddingBlockEnd: 2,
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
  fontVariantNumeric: "tabular-nums",
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

const nameStyles = css({
  fontFamily: "condensed",
  fontSize: "3xl",
  fontWeight: "bold",
  letterSpacing: "tight",
  lg: { fontSize: "4xl" },
  lineHeight: "condensed",
});

const setCountStyles = css({
  color: "muted",
  fontSize: "sm",
  fontWeight: "medium",
});

const fieldLabelStyles = css({ color: "muted", fontSize: "sm" });

const durationEchoStyles = css({ color: "textTertiary", fontSize: "xs" });

// The one glowing element in the product: the number under your thumb mid-set,
// read at arm's length. `shadows.glow` appears here and nowhere else.
const stepperValueStyles = css({
  color: "accent",
  fontFamily: "condensed",
  fontSize: "5xl",
  fontVariantNumeric: "tabular-nums",
  fontWeight: "bold",
  letterSpacing: "tight",
  lineHeight: "condensed",
  textShadow: "glow",
});

// Flat: a hairline accent rule on the inline-start edge instead of a filled
// chip, so "last time" reads as a quiet aside with a touch of color.
const previousStyles = css({
  borderInlineStart: "1px solid {colors.accent}",
  color: "muted",
  fontSize: "sm",
  paddingInlineStart: 3,
});

const adaptationStyles = css({
  borderInlineStart: "1px solid {colors.border}",
  color: "textTertiary",
  fontSize: "sm",
  paddingInlineStart: 3,
});

const nextStyles = css({
  color: "textTertiary",
  fontSize: "sm",
  lg: { display: "none" },
  textAlign: "center",
});

const mutedStyles = css({ color: "muted" });

const progressTrackStyles = hstack({ gap: 1 });

// Log / finish actions: stacked on phones, shared evenly across a row on
// desktop where there's width for both side by side.
const actionRowStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: 3,
  lg: {
    "& > *": { flex: 1 },
    flexDirection: "row",
  },
});
