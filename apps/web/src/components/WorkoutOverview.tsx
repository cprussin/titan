"use client";

import { ListChecksIcon } from "@phosphor-icons/react/dist/ssr/ListChecks";
import { css } from "../../styled-system/css";
import type { OverviewExercise, OverviewSet } from "../session-overview";
import { Button, ModalDialog } from "../ui";

type Props = {
  exercises: readonly OverviewExercise[];
};

/**
 * The session at a glance: every exercise in order with its target, the work
 * already logged against it set by set (load, reps or hold, and the rating), and
 * the ones still ahead left blank. The exercise in progress carries
 * `aria-current="step"` so the list reads as a position in the session rather
 * than a color difference.
 */
export const WorkoutOverview = ({ exercises }: Props) => (
  <ol className={listStyles}>
    {exercises.map((exercise, position) => (
      <li
        aria-current={exercise.state === "current" ? "step" : undefined}
        className={rowStyles}
        data-state={exercise.state}
        key={exercise.slotId}
      >
        <span className={badgeStyles}>{position + 1}</span>
        <div className={textStyles}>
          <span className={nameStyles}>{exercise.name}</span>
          <span className={targetStyles}>{exercise.target}</span>
          {exercise.sets.length > 0 && (
            <LoggedSets sets={exercise.sets} slotId={exercise.slotId} />
          )}
        </div>
      </li>
    ))}
  </ol>
);

/** The overview behind a trigger, for the widths where the standing rail is out
 *  of view — the phone screen the workout is actually run from. */
export const WorkoutOverviewDialog = ({ exercises }: Props) => (
  <ModalDialog
    title="Workout overview"
    trigger={
      <Button
        beforeIcon={<ListChecksIcon size={16} />}
        size="sm"
        variant="outline"
      >
        Overview
      </Button>
    }
  >
    <WorkoutOverview exercises={exercises} />
  </ModalDialog>
);

/** The work recorded against one exercise, a hairline-ruled row per set. */
const LoggedSets = ({
  sets,
  slotId,
}: {
  sets: readonly OverviewSet[];
  slotId: string;
}) => (
  <ul className={setListStyles}>
    {sets.map((set, index) => (
      <li className={setRowStyles} key={`${slotId}-${index}`}>
        {/* A cardio effort has no set label, but it keeps the label's gutter so
            its value lines up with the loads in the rows above it. */}
        <span className={setLabelStyles}>{set.label}</span>
        <span className={setValueStyles}>{set.value}</span>
        {set.rpe !== undefined && (
          <span className={rpeStyles}>RPE {set.rpe}</span>
        )}
      </li>
    ))}
  </ul>
);

const listStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: 2.5,
  listStyleType: "none",
  margin: 0,
  padding: 0,
});

// Done exercises recede, the one in progress takes the accent, the rest stay
// muted — the same three-state reading the progress track gives.
const rowStyles = css({
  "&[data-state='current']": { color: "accent" },
  "&[data-state='done']": { color: "textTertiary" },
  alignItems: "baseline",
  color: "muted",
  display: "flex",
  gap: 2.5,
});

const badgeStyles = css({
  fontFamily: "mono",
  fontSize: "xs",
  fontVariantNumeric: "tabular-nums",
  fontWeight: "bold",
  minInlineSize: 4,
  textAlign: "end",
});

const textStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: 0.5,
  minInlineSize: 0,
});

const nameStyles = css({ fontSize: "sm", fontWeight: "medium" });

const targetStyles = css({ color: "textTertiary", fontSize: "xs" });

const setListStyles = css({
  display: "flex",
  flexDirection: "column",
  listStyleType: "none",
  margin: 0,
  marginBlockStart: 1,
  padding: 0,
});

const setRowStyles = css({
  _first: { borderBlockStart: "none" },
  alignItems: "baseline",
  borderBlockStart: "1px solid {colors.border}",
  display: "flex",
  gap: 2,
  paddingBlock: 1,
});

const setLabelStyles = css({
  color: "textTertiary",
  fontSize: "xs",
  minInlineSize: 10,
});

// Mono with tabular figures so loads line up down the column instead of ragging.
const setValueStyles = css({
  color: "foreground",
  fontFamily: "mono",
  fontSize: "xs",
  fontVariantNumeric: "tabular-nums",
});

const rpeStyles = css({
  color: "muted",
  fontFamily: "mono",
  fontSize: "xs",
  fontVariantNumeric: "tabular-nums",
  marginInlineStart: "auto",
});
