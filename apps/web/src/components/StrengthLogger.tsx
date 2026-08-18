"use client";

import { MinusIcon } from "@phosphor-icons/react/dist/ssr/Minus";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { coarseLoadStep, fineLoadStep } from "@titan/domain/load-unit";
import type { Prescription } from "@titan/domain/prescription";
import type { ExerciseResult, SetResult } from "@titan/domain/result";
import type { PrescribedExercise } from "@titan/domain/workout-session";
import { useState } from "react";
import { css } from "../../styled-system/css";
import { hstack, vstack } from "../../styled-system/patterns";
import type { ScheduleTick } from "../tick-scheduler";
import { Button } from "../ui";
import { EffortTimer } from "./EffortTimer";
import { nextSetReps, nextSetWeight } from "./next-set-defaults";
import { RpePicker } from "./RpePicker";
import { WorkoutActionBar } from "./WorkoutActionBar";

/** The strength/bodyweight/timed-hold prescription shapes this logger drives. */
type StrengthLikePrescription = Extract<
  Prescription,
  { type: "strength" | "bodyweight" | "timed-hold" }
>;

type Props = {
  busy: boolean;
  logged: readonly SetResult[];
  onComplete: (result: ExerciseResult) => void;
  /** Replace an already-logged set (edit an earlier row). */
  onEditSet: (index: number, set: SetResult) => void;
  onLogSet: (set: SetResult) => void;
  /** Drop the most recently logged set (the Back affordance). */
  onUndoLastSet: () => void;
  prescribed: PrescribedExercise;
  prescription: StrengthLikePrescription;
  /** Tick scheduler for the hold timer, injected for testing; defaults to a 1s
   *  `setInterval` inside {@link EffortTimer}. */
  schedule?: ScheduleTick;
};

/**
 * Logs one strength-style exercise, set by set: a prefilled input for the set
 * in progress (weight carried from the last set, reps reset to the prescribed
 * target), the sets already logged shown above it with inline edit controls, and
 * a Back affordance that undoes the last set and hands its values back for
 * re-logging.
 *
 * RPE is mandatory: unlike the load and rep inputs there is nothing sensible to
 * prefill an effort rating with, so it re-seeds to unset for every set and the
 * "Log set" action stays disabled until the athlete rates the one just done.
 */
export const StrengthLogger = ({
  busy,
  logged,
  onComplete,
  onEditSet,
  onLogSet,
  onUndoLastSet,
  prescribed,
  prescription,
  schedule,
}: Props) => {
  const sets = prescription.sets;
  const done = logged.length;
  const isHold = prescription.type === "timed-hold";
  const holdTarget =
    prescription.type === "timed-hold" ? prescription.holdSec : undefined;
  const unit = prescription.type === "strength" ? prescription.unit : undefined;
  const [weight, setWeight] = useState(nextSetWeight(prescription, logged));
  const [reps, setReps] = useState(nextSetReps(prescription));
  const [holdSec, setHoldSec] = useState(isHold ? prescription.holdSec : 0);
  const [rpe, setRpe] = useState<number | undefined>(undefined);

  // Carryover is scoped to a single exercise: within one movement the inputs
  // hold the last set's load, but moving on to a different exercise re-seeds
  // them to that exercise's prescribed targets rather than dragging the
  // previous movement's weight forward. Tracking the slot id and re-seeding
  // when it changes is React's "adjust state during render" pattern for a
  // prop-driven reset.
  const [slotId, setSlotId] = useState(prescribed.slotId);
  if (slotId !== prescribed.slotId) {
    setSlotId(prescribed.slotId);
    setWeight(nextSetWeight(prescription, logged));
    setReps(nextSetReps(prescription));
    setHoldSec(isHold ? prescription.holdSec : 0);
    setRpe(undefined);
  }

  const logSet = () => {
    // The action is disabled until the set is rated, so an unrated set reaching
    // here is a broken invariant rather than a set to log without an RPE.
    if (rpe === undefined) {
      throw new Error("Log set pressed before the set was rated");
    } else {
      onLogSet({
        completed: true,
        rpe,
        setIndex: done,
        ...(isHold ? { holdSec } : { reps, weight }),
      });
      setRpe(undefined);
    }
  };

  const back = () => {
    const last = logged.at(-1);
    if (last === undefined) {
      throw new Error("Back pressed with no logged set to undo");
    } else {
      if (last.weight !== undefined) {
        setWeight(last.weight);
      }
      if (last.reps !== undefined) {
        setReps(last.reps);
      }
      if (last.holdSec !== undefined) {
        setHoldSec(last.holdSec);
      }
      setRpe(last.rpe);
      onUndoLastSet();
    }
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
    <div className={rootStyles}>
      {logged.length > 0 && (
        <LoggedSets
          isHold={isHold}
          onEditSet={onEditSet}
          sets={logged}
          unit={unit}
        />
      )}
      <p className={setCountStyles}>
        {done >= sets ? "All sets logged" : `Set ${done + 1} of ${sets}`}
      </p>
      {done < sets && (
        <div className={vstack({ alignItems: "stretch", gap: 3 })}>
          {isHold ? (
            <div className={vstack({ alignItems: "stretch", gap: 3 })}>
              <EffortTimer
                onUse={(seconds) => setHoldSec(seconds)}
                schedule={schedule}
                targetSeconds={holdTarget}
              />
              <Stepper
                label="Hold (sec)"
                onChange={setHoldSec}
                step={5}
                value={holdSec}
              />
            </div>
          ) : (
            <>
              {unit !== undefined && (
                <Stepper
                  fineStep={fineLoadStep(unit)}
                  label={`Weight (${unit})`}
                  onChange={setWeight}
                  step={coarseLoadStep}
                  value={weight}
                />
              )}
              <Stepper label="Reps" onChange={setReps} step={1} value={reps} />
            </>
          )}
          <RpePicker onChange={setRpe} value={rpe} />
        </div>
      )}
      {/* Back, log, and finish actions pin to the bottom of the screen so the
          primary controls stay under the thumb while the logged sets scroll
          above. Stacked on phones, shared evenly across a row on desktop. */}
      <WorkoutActionBar>
        {done > 0 && (
          <Button onClick={back} size="lg" variant="outline">
            Back
          </Button>
        )}
        {done < sets && (
          <Button
            disabled={rpe === undefined}
            onClick={logSet}
            size="lg"
            variant="accent"
          >
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
      </WorkoutActionBar>
    </div>
  );
};

type LoggedSetsProps = {
  isHold: boolean;
  onEditSet: (index: number, set: SetResult) => void;
  sets: readonly SetResult[];
  unit: string | undefined;
};

/** The sets logged so far, each editable in place so a mistake on an earlier
 *  set can be corrected without re-doing the exercise. */
const LoggedSets = ({ isHold, onEditSet, sets, unit }: LoggedSetsProps) => (
  <div className={vstack({ alignItems: "stretch", gap: 2 })}>
    <span className={loggedTitleStyles}>Logged</span>
    {sets.map((set, index) => (
      <LoggedSetRow
        index={index}
        isHold={isHold}
        key={set.setIndex}
        onEditSet={onEditSet}
        set={set}
        unit={unit}
      />
    ))}
  </div>
);

type LoggedSetRowProps = {
  index: number;
  isHold: boolean;
  onEditSet: (index: number, set: SetResult) => void;
  set: SetResult;
  unit: string | undefined;
};

const LoggedSetRow = ({
  index,
  isHold,
  onEditSet,
  set,
  unit,
}: LoggedSetRowProps) => (
  <div className={loggedRowStyles}>
    <span className={loggedRowLabelStyles}>Set {index + 1}</span>
    <div className={hstack({ gap: 3 })}>
      {isHold ? (
        <MiniStepper
          label={`Set ${index + 1} hold`}
          onChange={(value) => onEditSet(index, { ...set, holdSec: value })}
          step={5}
          suffix="s"
          value={set.holdSec ?? 0}
        />
      ) : (
        <>
          <MiniStepper
            label={`Set ${index + 1} weight`}
            onChange={(value) => onEditSet(index, { ...set, weight: value })}
            step={coarseLoadStep}
            suffix={unit}
            value={set.weight ?? 0}
          />
          <MiniStepper
            label={`Set ${index + 1} reps`}
            onChange={(value) => onEditSet(index, { ...set, reps: value })}
            step={1}
            value={set.reps ?? 0}
          />
        </>
      )}
    </div>
  </div>
);

type StepperProps = {
  /** When set, renders a second, smaller pair of +/- controls that nudge the
   *  value by this amount — the fine adjustment alongside the coarse `step`. */
  fineStep?: number | undefined;
  label: string;
  onChange: (value: number) => void;
  step: number;
  value: number;
};

const Stepper = ({ fineStep, label, onChange, step, value }: StepperProps) => {
  // The glowing value doubles as a text field so the athlete can type an exact
  // load or rep count. `draft` holds the raw text while editing; `seenValue`
  // tracks the numeric value we last emitted so an incoming `value` we *didn't*
  // originate (a +/- press, or the parent re-seeding for a new set) re-seeds the
  // field, while a mid-typed "12." the athlete is still completing is left be.
  const [draft, setDraft] = useState(() => String(value));
  const [seenValue, setSeenValue] = useState(value);
  if (seenValue !== value) {
    setSeenValue(value);
    setDraft(String(value));
  }

  const edit = (raw: string) => {
    setDraft(raw);
    const parsed = parseFieldValue(raw);
    if (parsed !== undefined) {
      onChange(parsed);
      setSeenValue(parsed);
    }
  };

  return (
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
        {fineStep !== undefined && (
          <Button
            label={`Fine decrease ${label}`}
            onClick={() => onChange(Math.max(0, value - fineStep))}
            size="xs"
            variant="outline"
          >
            <MinusIcon size={14} />
          </Button>
        )}
        <input
          aria-label={label}
          className={stepperInputStyles}
          inputMode="decimal"
          onBlur={() => setDraft(String(value))}
          onChange={(event) => edit(event.target.value)}
          value={draft}
        />
        {fineStep !== undefined && (
          <Button
            label={`Fine increase ${label}`}
            onClick={() => onChange(value + fineStep)}
            size="xs"
            variant="outline"
          >
            <PlusIcon size={14} />
          </Button>
        )}
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
};

type MiniStepperProps = {
  label: string;
  onChange: (value: number) => void;
  step: number;
  suffix?: string | undefined;
  value: number;
};

/** A compact +/- control for editing an already-logged set inline, sized to sit
 *  quietly above the primary set input rather than compete with it. */
const MiniStepper = ({
  label,
  onChange,
  step,
  suffix,
  value,
}: MiniStepperProps) => (
  <div className={hstack({ gap: 1 })}>
    <Button
      label={`Decrease ${label}`}
      onClick={() => onChange(Math.max(0, value - step))}
      size="xs"
      variant="outline"
    >
      <MinusIcon size={14} />
    </Button>
    <span className={miniValueStyles}>
      {value}
      {suffix === undefined ? "" : ` ${suffix}`}
    </span>
    <Button
      label={`Increase ${label}`}
      onClick={() => onChange(value + step)}
      size="xs"
      variant="outline"
    >
      <PlusIcon size={14} />
    </Button>
  </div>
);

/** Parse the stepper field's text into a non-negative number, or `undefined`
 *  while it holds an entry not yet worth committing — empty, a lone sign or
 *  decimal point, or otherwise non-numeric — so those transient keystrokes
 *  don't push a bogus value up as the athlete types. */
const parseFieldValue = (raw: string): number | undefined => {
  const trimmed = raw.trim();
  const parsed = Number(trimmed);
  return trimmed !== "" && Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : undefined;
};

const setCountStyles = css({
  color: "muted",
  fontSize: "sm",
  fontWeight: "medium",
});

const fieldLabelStyles = css({ color: "muted", fontSize: "sm" });

const loggedTitleStyles = css({
  color: "muted",
  fontSize: "xs",
  fontWeight: "medium",
  letterSpacing: "wide",
  textTransform: "uppercase",
});

const loggedRowStyles = css({
  alignItems: "center",
  borderBlockEnd: "1px solid {colors.border}",
  display: "flex",
  gap: 3,
  justifyContent: "space-between",
  paddingBlockEnd: 2,
});

const loggedRowLabelStyles = css({
  color: "textTertiary",
  fontSize: "sm",
  fontWeight: "medium",
});

const miniValueStyles = css({
  fontFamily: "mono",
  fontSize: "sm",
  fontVariantNumeric: "tabular-nums",
  fontWeight: "medium",
  minInlineSize: 12,
  textAlign: "center",
});

// The one glowing element in the product: the number under your thumb mid-set,
// read at arm's length, and editable in place so an exact load can be typed.
// `shadows.glow` appears here and nowhere else.
const stepperInputStyles = css({
  backgroundColor: "transparent",
  borderStyle: "none",
  color: "accent",
  flexGrow: 1,
  fontFamily: "condensed",
  fontSize: "5xl",
  fontVariantNumeric: "tabular-nums",
  fontWeight: "bold",
  inlineSize: "100%",
  letterSpacing: "tight",
  lineHeight: "condensed",
  minInlineSize: 0,
  outlineStyle: "none",
  padding: 0,
  textAlign: "center",
  textShadow: "glow",
});

// Fills the viewport-height work column below `lg` (see WorkoutScreenLayout) so
// the action bar's `margin-block-start: auto` can carry it to the bottom of the
// screen; at `lg` the column is content-height and the bar sits inline.
const rootStyles = css({
  alignItems: "stretch",
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,
  gap: 3,
});
