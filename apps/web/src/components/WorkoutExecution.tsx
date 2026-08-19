"use client";

import type { Modality } from "@titan/domain/movement";
import type { Prescription } from "@titan/domain/prescription";
import type { ExerciseResult, SetResult } from "@titan/domain/result";
import type { PrescribedExercise } from "@titan/domain/workout-session";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { css } from "../../styled-system/css";
import { flex, hstack, vstack } from "../../styled-system/patterns";
import { describePrescription } from "../prescription-text";
import { roleTone } from "../role-tone";
import {
  saveWorkoutProgress,
  WorkoutSaveOutcome,
} from "../save-workout-progress";
import type { ResumePoint } from "../server/resume-workout";
import { sessionOverview } from "../session-overview";
import { Badge } from "../ui";
import { WorkoutProgressRequest } from "../workout-progress-request";
import { CancelWorkoutButton } from "./CancelWorkoutButton";
import { CardioLogger } from "./CardioLogger";
import { PrescriptionTarget } from "./PrescriptionTarget";
import { describePreviousPerformance } from "./previous-performance";
import { RestTimer } from "./RestTimer";
import { StrengthLogger } from "./StrengthLogger";
import { WorkoutOverview, WorkoutOverviewDialog } from "./WorkoutOverview";
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
  /** Where the stored session leaves off, so a reload or a second device carries
   *  on from the last logged set rather than starting the workout over. */
  resume: ResumePoint;
  /** Persists progress; injected in tests, defaults to the real endpoint call. */
  save?: typeof saveWorkoutProgress;
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
  resume,
  save = saveWorkoutProgress,
  sessionId,
}: Props) => {
  const router = useRouter();
  const [index, setIndex] = useState(resume.index);
  const [results, setResults] = useState<ExerciseResult[]>([...resume.results]);
  const [logged, setLogged] = useState<SetResult[]>([...resume.logged]);
  const [resting, setResting] = useState(false);
  const [busy, setBusy] = useState(false);

  const current = prescribedExercises[index];
  const next = prescribedExercises[index + 1];
  const overview = sessionOverview({
    currentIndex: index,
    exerciseNames,
    logged,
    prescribedExercises,
    results,
  });

  // The server refused the save: the session is finished, cancelled, or simply
  // ahead of this screen because another device got there first. Which one it is
  // only the server knows, so re-render the page and let it place the athlete —
  // the finished workout, a "not found" if the session is gone, or a re-seeded
  // screen at the position the session actually reached. The save is over either
  // way, so the screen comes back to life rather than sitting on a spinner.
  const closed = useCallback(() => {
    setBusy(false);
    router.refresh();
  }, [router]);

  const advance = useCallback(
    (exerciseResult: ExerciseResult) => {
      const nextResults = [...results, exerciseResult];
      const isLast = index + 1 >= prescribedExercises.length;
      setBusy(true);
      save(
        sessionId,
        isLast
          ? WorkoutProgressRequest.Finished(exerciseResult)
          : WorkoutProgressRequest.Recorded(exerciseResult),
      )
        .then((outcome) => {
          if (outcome === WorkoutSaveOutcome.SessionClosed) {
            closed();
          } else if (isLast) {
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
    [
      closed,
      index,
      prescribedExercises.length,
      results,
      router,
      save,
      sessionId,
    ],
  );

  // Every logged set is persisted as it happens, in the background: the athlete
  // is already resting by the time the write lands, so the screen never waits on
  // it. An edit or an undo restates the sets underway just as a new set does —
  // and only those, so a save issued from a stale snapshot (an edit made while
  // the exercise is being recorded, say) can never rewrite the recorded results.
  // A set the server won't take is not dropped quietly: the screen follows the
  // session wherever it now stands.
  const recordLogged = useCallback(
    (sets: SetResult[], slotId: string) => {
      setLogged(sets);
      save(sessionId, WorkoutProgressRequest.Sets({ sets, slotId }))
        .then((outcome) => {
          if (outcome === WorkoutSaveOutcome.SessionClosed) {
            closed();
          }
        })
        .catch((error: unknown) => {
          // biome-ignore lint/suspicious/noConsole: surface a save failure
          console.error("Failed to save workout progress", error);
        });
    },
    [closed, save, sessionId],
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
          <div className={outlineStyles}>
            <span className={outlineTitleStyles}>Session</span>
            <WorkoutOverview exercises={overview} />
          </div>
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

            {/* The phone stand-in for the outline rail: the "up next" hint
                beside the control that opens the whole session. It sits above
                the logger so the logger stays the last child and its action bar
                can drop to the bottom of the screen. */}
            <div className={upNextStyles}>
              {next !== undefined && (
                <p className={nextStyles}>
                  Next: {exerciseNames[next.exerciseId] ?? next.exerciseId} ·{" "}
                  {describePrescription(next.prescription)}
                </p>
              )}
              <WorkoutOverviewDialog exercises={overview} />
            </div>

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
                  recordLogged(
                    logged.map((existing, position) =>
                      position === setIndex ? set : existing,
                    ),
                    current.slotId,
                  );
                }}
                onLogSet={(set) => {
                  const nowLogged = [...logged, set];
                  recordLogged(nowLogged, current.slotId);
                  if (nowLogged.length < totalSets(current.prescription)) {
                    setResting(true);
                  }
                }}
                onUndoLastSet={() => {
                  recordLogged(logged.slice(0, -1), current.slotId);
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

// Hidden from `lg` up, where the standing outline rail carries the same ground
// in full. Wraps to its own line when the hint and the control won't share one.
const upNextStyles = flex({
  alignItems: "center",
  flexWrap: "wrap",
  gap: 2,
  justifyContent: "center",
  lg: { display: "none" },
});

const nextStyles = css({ color: "textTertiary", fontSize: "sm" });

const mutedStyles = css({ color: "muted" });

const progressTrackStyles = hstack({ gap: 1 });
