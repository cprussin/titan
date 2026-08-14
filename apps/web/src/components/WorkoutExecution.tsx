"use client";

import type { Modality } from "@titan/domain/movement";
import type { Prescription } from "@titan/domain/prescription";
import type { ExerciseResult, SetResult } from "@titan/domain/result";
import type { PrescribedExercise } from "@titan/domain/workout-session";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { css } from "../../styled-system/css";
import { hstack, vstack } from "../../styled-system/patterns";
import { describePrescription } from "../prescription-text";
import { roleTone } from "../role-tone";
import { Badge } from "../ui";
import { CancelWorkoutButton } from "./CancelWorkoutButton";
import { CardioLogger } from "./CardioLogger";
import { PrescriptionTarget } from "./PrescriptionTarget";
import { describePreviousPerformance } from "./previous-performance";
import { RestTimer } from "./RestTimer";
import { StrengthLogger } from "./StrengthLogger";
import { WorkoutScreenLayout } from "./WorkoutScreenLayout";

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
      <WorkoutScreenLayout
        actions={<CancelWorkoutButton sessionId={sessionId} size="sm" />}
        aside={
          <SessionOutline
            currentIndex={index}
            exerciseNames={exerciseNames}
            prescribedExercises={prescribedExercises}
          />
        }
        main={
          <>
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

            {/* The "up next" hint stands in for the outline on phones. It sits
                above the logger so the logger stays the last child and its
                action bar can drop to the bottom of the screen. */}
            {next !== undefined && (
              <p className={nextStyles}>
                Next: {exerciseNames[next.exerciseId] ?? next.exerciseId} ·{" "}
                {describePrescription(next.prescription)}
              </p>
            )}

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
                onEditSet={(setIndex, set) => {
                  setLogged((sets) =>
                    sets.map((existing, position) =>
                      position === setIndex ? set : existing,
                    ),
                  );
                }}
                onLogSet={(set) => {
                  const nowLogged = [...logged, set];
                  setLogged(nowLogged);
                  if (nowLogged.length < totalSets(current.prescription)) {
                    setResting(true);
                  }
                }}
                onUndoLastSet={() => {
                  setLogged((sets) => sets.slice(0, -1));
                }}
                prescribed={current}
                sessionId={sessionId}
              />
            )}
          </>
        }
        progress={
          <ProgressBar
            current={index}
            segments={prescribedExercises.map((exercise) => exercise.slotId)}
          />
        }
      />
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
  onEditSet: (index: number, set: SetResult) => void;
  onLogSet: (set: SetResult) => void;
  onUndoLastSet: () => void;
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
  onEditSet,
  onLogSet,
  onUndoLastSet,
  prescribed,
  sessionId,
}: ExerciseLoggerProps) => {
  const { prescription } = prescribed;
  return isStrengthLike(prescription) ? (
    <StrengthLogger
      busy={busy}
      logged={logged}
      onComplete={onComplete}
      onEditSet={onEditSet}
      onLogSet={onLogSet}
      onUndoLastSet={onUndoLastSet}
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

const PreviousPerformance = ({
  previous,
}: {
  previous: ExerciseResult | undefined;
}) => {
  const summary =
    previous === undefined ? undefined : describePreviousPerformance(previous);
  return summary === undefined ? undefined : (
    <p className={previousStyles}>Last time: {summary}</p>
  );
};

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

const restSeconds = (prescribed: PrescribedExercise): number =>
  prescribed.role === "primary" ? 150 : 90;

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
