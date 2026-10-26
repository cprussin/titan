import type { Prescription } from "@titan/domain/prescription";
import type { ExerciseSlot, SlotRole } from "@titan/domain/program";
import type { SelectedVariant } from "@titan/program-engine/variant";
import type {
  BlockContext,
  BlockOutcome,
  ScheduledWorkout,
  WeekWorkout,
} from "./program-explorer";
import {
  BlockOutcomeKind,
  blockOutcome,
  blockSchedule,
  blockWeekSchedules,
  blockWeekSummary,
  SessionOptionsKind,
  sessionOptions,
  showsWeekSections,
  stripWeekPrefix,
} from "./program-explorer";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type BlockSlotView = {
  id: string;
  name: string;
  /** 1-based ordinal, shown only when a list has more than one slot. */
  position: number | undefined;
  prescription: Prescription;
  role: SlotRole;
};

export type BlockDayContent =
  | { kind: "slots"; slots: readonly BlockSlotView[] }
  | {
      hint: string;
      kind: "options";
      options: readonly {
        label: string | undefined;
        slots: readonly BlockSlotView[];
      }[];
    };

export type BlockDayView = {
  content: BlockDayContent;
  dayName: string;
  durationMin: number;
  key: string;
  name: string;
  variantTag: string | undefined;
};

export type BlockView = {
  active: boolean;
  blockId: string;
  layout:
    | {
        kind: "weeks";
        weeks: readonly {
          days: readonly BlockDayView[];
          isDeload: boolean;
          summary: string;
          week: number;
        }[];
      }
    | { days: readonly BlockDayView[]; kind: "fixed" };
  name: string;
  outcome:
    | { blockId: string; kind: "next"; name: string }
    | { kind: "complete" }
    | { kind: "repeats" };
  programName: string;
  versionId: string;
};

/**
 * The program explorer's block page, resolved for a client that renders rather
 * than computes (the Android app): the same week/day/slot layout `BlockContent`
 * builds, with exercise names applied.
 */
export const blockView = (
  { block, program, version }: BlockContext,
  active: boolean,
  names: ReadonlyMap<string, string>,
): BlockView => ({
  active,
  blockId: block.id,
  layout: showsWeekSections(block)
    ? {
        kind: "weeks",
        weeks: blockWeekSchedules(version, block).map((week) => ({
          days: week.workouts.map((workout) => weekDay(workout, names)),
          isDeload: week.isDeload,
          summary: blockWeekSummary(week),
          week: week.week,
        })),
      }
    : {
        days: blockSchedule(version, block).map((workout) =>
          fixedDay(workout, names),
        ),
        kind: "fixed",
      },
  name: block.name,
  outcome: outcomeView(blockOutcome(version, block)),
  programName: program.name,
  versionId: version.id,
});

const weekDay = (
  workout: WeekWorkout,
  names: ReadonlyMap<string, string>,
): BlockDayView => ({
  content: { kind: "slots", slots: slotViews(workout.variant.slots, names) },
  dayName: dayName(workout.dayOfWeek),
  durationMin: workout.template.targetDurationMin,
  key: `${workout.dayOfWeek}-${workout.template.id}`,
  name: workout.template.name,
  variantTag:
    workout.variant.label === undefined
      ? undefined
      : stripWeekPrefix(workout.variant.label),
});

const fixedDay = (
  workout: ScheduledWorkout,
  names: ReadonlyMap<string, string>,
): BlockDayView => ({
  content: fixedContent(workout, names),
  dayName: dayName(workout.dayOfWeek),
  durationMin: workout.template.targetDurationMin,
  key: `${workout.dayOfWeek}-${workout.template.id}`,
  name: workout.template.name,
  variantTag: undefined,
});

const fixedContent = (
  workout: ScheduledWorkout,
  names: ReadonlyMap<string, string>,
): BlockDayContent => {
  const options = sessionOptions(workout.template);
  switch (options.kind) {
    case SessionOptionsKind.Fixed: {
      return { kind: "slots", slots: slotViews(options.slots, names) };
    }
    case SessionOptionsKind.WeeklyRotation: {
      return optionsContent(
        options.options,
        "Rotates by week — one option runs each week.",
        names,
      );
    }
    case SessionOptionsKind.AthleteChoice: {
      return optionsContent(
        options.options,
        "Choose one — equivalent options for the same session, picked when the workout starts.",
        names,
      );
    }
  }
};

const optionsContent = (
  options: readonly SelectedVariant[],
  hint: string,
  names: ReadonlyMap<string, string>,
): BlockDayContent => ({
  hint,
  kind: "options",
  options: options.map((option) => ({
    label: option.label,
    slots: slotViews(option.slots, names),
  })),
});

const slotViews = (
  slots: readonly ExerciseSlot[],
  names: ReadonlyMap<string, string>,
): readonly BlockSlotView[] =>
  slots.map((slot, index) => ({
    id: slot.id,
    name: names.get(slot.exerciseId) ?? slot.exerciseId,
    position: slots.length > 1 ? index + 1 : undefined,
    prescription: slot.base,
    role: slot.role,
  }));

const outcomeView = (outcome: BlockOutcome): BlockView["outcome"] => {
  switch (outcome.kind) {
    case BlockOutcomeKind.NextBlock: {
      return {
        blockId: outcome.block.id,
        kind: "next",
        name: outcome.block.name,
      };
    }
    case BlockOutcomeKind.ProgramComplete: {
      return { kind: "complete" };
    }
    case BlockOutcomeKind.RepeatsIndefinitely: {
      return { kind: "repeats" };
    }
  }
};

const dayName = (dayOfWeek: number): string => {
  const name = DAY_NAMES[dayOfWeek - 1];
  if (name === undefined) {
    throw new Error(`invalid ISO weekday ${dayOfWeek}`);
  } else {
    return name;
  }
};
