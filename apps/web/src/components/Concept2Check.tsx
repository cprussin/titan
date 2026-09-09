"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import type { NormalizedWorkout } from "@titan/domain/external";
import { useCallback, useEffect, useRef, useState } from "react";
import { css } from "../../styled-system/css";
import { hstack, vstack } from "../../styled-system/patterns";
import { cardioSummary } from "../cardio-summary";
import type { Concept2MatchResult } from "../concept2-match-result";
import { Button, ModalDialog } from "../ui";

type Props = {
  /** Sync Concept2 and report whether a workout matches the current session. */
  check: () => Promise<Concept2MatchResult>;
  /** Called once with the matched workout so the caller can log it and advance. */
  onFound: (normalized: NormalizedWorkout) => void;
};

enum PhaseKind {
  Idle,
  Choosing,
  Found,
  NotFound,
  Error,
}

const Phase = {
  Choosing: (candidates: readonly NormalizedWorkout[]) => ({
    candidates,
    kind: PhaseKind.Choosing as const,
  }),
  Error: () => ({ kind: PhaseKind.Error as const }),
  Found: () => ({ kind: PhaseKind.Found as const }),
  Idle: () => ({ kind: PhaseKind.Idle as const }),
  NotFound: () => ({ kind: PhaseKind.NotFound as const }),
};

type Phase = ReturnType<(typeof Phase)[keyof typeof Phase]>;

/** Time between background polls while the athlete sits on the rowing step, so a
 *  row finished mid-workout is picked up without the athlete lifting a finger. */
const POLL_INTERVAL_MS = 20_000;

/**
 * The Concept2 hand-off on a rowing piece: on mount and on an interval it
 * quietly syncs and, the moment a matching row shows up (already logged, or
 * finished mid-workout), reports it so the screen advances. The athlete can also
 * force a check; only that explicit press surfaces the "no match" prompt, so the
 * background poll never nags.
 *
 * When more than one row hits the target the hand-off stops and asks: the
 * matcher has no way to tell a warm-up from a cool-down rowed to the same
 * prescription, and picking one for the athlete would silently log the wrong
 * piece. Asking also stops the poll, so the choices hold still under the prompt.
 */
export const Concept2Check = ({ check, onFound }: Props) => {
  const [phase, setPhase] = useState<Phase>(Phase.Idle());
  const [checking, setChecking] = useState(false);
  const foundRef = useRef(false);
  const pollingRef = useRef(true);

  const runCheck = useCallback(
    (manual: boolean) => {
      setChecking(true);
      check()
        .then((result) => {
          setChecking(false);
          if (!foundRef.current) {
            switch (result.status) {
              case "matched": {
                foundRef.current = true;
                pollingRef.current = false;
                setPhase(Phase.Found());
                onFound(result.normalized);
                break;
              }
              case "ambiguous": {
                pollingRef.current = false;
                setPhase(Phase.Choosing(result.candidates));
                break;
              }
              case "not-matched": {
                if (manual) {
                  setPhase(Phase.NotFound());
                }
                break;
              }
            }
          }
        })
        .catch((error: unknown) => {
          setChecking(false);
          if (manual) {
            setPhase(Phase.Error());
          }
          // biome-ignore lint/suspicious/noConsole: surface a Concept2 check failure
          console.error("Concept2 check failed", error);
        });
    },
    [check, onFound],
  );

  useEffect(() => {
    runCheck(false);
    const timer = setInterval(() => {
      if (pollingRef.current) {
        runCheck(false);
      }
    }, POLL_INTERVAL_MS);
    return () => {
      clearInterval(timer);
    };
  }, [runCheck]);

  const startManualCheck = () => {
    runCheck(true);
  };
  const dismiss = () => {
    setPhase(Phase.Idle());
  };
  const pick = (normalized: NormalizedWorkout) => {
    foundRef.current = true;
    setPhase(Phase.Found());
    onFound(normalized);
  };

  switch (phase.kind) {
    case PhaseKind.Idle: {
      return (
        <div className={rootStyles}>
          <p className={hintStyles}>
            {checking
              ? "Checking Concept2 for your row…"
              : "Rowed this on a Concept2?"}
          </p>
          <Button
            beforeIcon={<MagnifyingGlassIcon size={18} />}
            loading={checking}
            onClick={startManualCheck}
            variant="outline"
          >
            Check Concept2
          </Button>
        </div>
      );
    }
    case PhaseKind.Choosing: {
      return (
        <ChoicePrompt
          candidates={phase.candidates}
          onCancel={dismiss}
          onPick={pick}
        />
      );
    }
    case PhaseKind.Found: {
      return <p className={foundStyles}>Workout found</p>;
    }
    case PhaseKind.NotFound: {
      return (
        <RetryPrompt
          checking={checking}
          message="No matching workout found, try again?"
          onCancel={dismiss}
          onRetry={startManualCheck}
        />
      );
    }
    case PhaseKind.Error: {
      return (
        <RetryPrompt
          checking={checking}
          message="Couldn't reach Concept2. Try again?"
          onCancel={dismiss}
          onRetry={startManualCheck}
        />
      );
    }
  }
};

/** The rows that all hit the slot's target, for the athlete to pick between.
 *  Each is labelled with the time it was rowed — what tells two pieces on one
 *  prescription apart — and the optics it recorded. */
const ChoicePrompt = ({
  candidates,
  onCancel,
  onPick,
}: {
  candidates: readonly NormalizedWorkout[];
  onCancel: () => void;
  onPick: (normalized: NormalizedWorkout) => void;
}) => (
  <ModalDialog
    footer={
      <Button onClick={onCancel} variant="ghost">
        Not these
      </Button>
    }
    onOpenChange={(open) => {
      if (!open) {
        onCancel();
      }
    }}
    open
    title="Which row was this?"
  >
    <div className={choicesStyles}>
      <p className={hintStyles}>
        More than one Concept2 row matches this piece.
      </p>
      {candidates.map((candidate, index) => (
        <Button
          key={index}
          onClick={() => {
            onPick(candidate);
          }}
          variant="outline"
        >
          {`${timeRowed(candidate)} · ${cardioSummary(candidate.summary)}`}
        </Button>
      ))}
    </div>
  </ModalDialog>
);

/** The wall-clock time the piece was rowed. Concept2 stamps the logbook in the
 *  athlete's local time, so the `HH:MM` sits ready in the timestamp. */
const timeRowed = (normalized: NormalizedWorkout): string =>
  normalized.workoutAt.slice(11, 16);

const RetryPrompt = ({
  checking,
  message,
  onCancel,
  onRetry,
}: {
  checking: boolean;
  message: string;
  onCancel: () => void;
  onRetry: () => void;
}) => (
  <div className={rootStyles}>
    <p className={hintStyles}>{message}</p>
    <div className={actionsStyles}>
      <Button loading={checking} onClick={onRetry} variant="outline">
        Retry
      </Button>
      <Button disabled={checking} onClick={onCancel} variant="ghost">
        Cancel
      </Button>
    </div>
  </div>
);

const rootStyles = vstack({ alignItems: "stretch", gap: 2 });

const choicesStyles = vstack({ alignItems: "stretch", gap: 3 });

const hintStyles = css({ color: "muted", fontSize: "sm" });

const foundStyles = css({
  color: "success",
  fontSize: "sm",
  fontWeight: "medium",
});

const actionsStyles = hstack({ gap: 2 });
