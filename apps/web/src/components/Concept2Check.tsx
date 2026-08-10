"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import type { NormalizedWorkout } from "@titan/domain/external";
import { useCallback, useEffect, useRef, useState } from "react";
import { css } from "../../styled-system/css";
import { hstack, vstack } from "../../styled-system/patterns";
import type { Concept2MatchResult } from "../concept2-match-result";
import { Button } from "../ui";

type Props = {
  /** Sync Concept2 and report whether a workout matches the current session. */
  check: () => Promise<Concept2MatchResult>;
  /** Called once with the matched workout so the caller can log it and advance. */
  onFound: (normalized: NormalizedWorkout) => void;
};

type Phase =
  | { status: "idle" }
  | { status: "found" }
  | { status: "notFound" }
  | { status: "error" };

/** Time between background polls while the athlete sits on the rowing step, so a
 *  row finished mid-workout is picked up without the athlete lifting a finger. */
const POLL_INTERVAL_MS = 20_000;

/**
 * The Concept2 hand-off on a rowing piece: on mount and on an interval it
 * quietly syncs and, the moment a matching row shows up (already logged, or
 * finished mid-workout), reports it so the screen advances. The athlete can also
 * force a check; only that explicit press surfaces the "no match" prompt, so the
 * background poll never nags.
 */
export const Concept2Check = ({ check, onFound }: Props) => {
  const [phase, setPhase] = useState<Phase>({ status: "idle" });
  const [checking, setChecking] = useState(false);
  const foundRef = useRef(false);

  const runCheck = useCallback(
    (manual: boolean) => {
      setChecking(true);
      check()
        .then((result) => {
          setChecking(false);
          if (result.matched) {
            if (!foundRef.current) {
              foundRef.current = true;
              setPhase({ status: "found" });
              onFound(result.normalized);
            }
          } else if (manual) {
            setPhase({ status: "notFound" });
          }
        })
        .catch((error: unknown) => {
          setChecking(false);
          if (manual) {
            setPhase({ status: "error" });
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
      if (!foundRef.current) {
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
    setPhase({ status: "idle" });
  };

  switch (phase.status) {
    case "idle": {
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
    case "found": {
      return <p className={foundStyles}>Workout found</p>;
    }
    case "notFound": {
      return (
        <RetryPrompt
          checking={checking}
          message="No matching workout found, try again?"
          onCancel={dismiss}
          onRetry={startManualCheck}
        />
      );
    }
    case "error": {
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

const hintStyles = css({ color: "muted", fontSize: "sm" });

const foundStyles = css({
  color: "success",
  fontSize: "sm",
  fontWeight: "medium",
});

const actionsStyles = hstack({ gap: 2 });
