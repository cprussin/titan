import type {
  Program,
  ProgramVersion,
  SessionTemplate,
  TrainingBlock,
} from "@titan/domain/program";
import type { SelectedVariant } from "@titan/program-engine/variant";
import { selectVariant } from "@titan/program-engine/variant";

/** A program paired with the immutable version its blocks are explored from. */
export type ProgramWithVersion = {
  program: Program;
  version: ProgramVersion;
};

/** One scheduled workout within a block's week: the ISO weekday it lands on and
 *  the session template that runs. */
export type ScheduledWorkout = {
  dayOfWeek: number;
  template: SessionTemplate;
};

/** The full context for the block-detail view: the block plus the program and
 *  version it belongs to. */
export type BlockContext = {
  block: TrainingBlock;
  program: Program;
  version: ProgramVersion;
};

/** One resolved workout within a specific week: the weekday it lands on, its
 *  session template, and the exact variant the scheduler picks *that week*. */
export type WeekWorkout = {
  dayOfWeek: number;
  template: SessionTemplate;
  variant: SelectedVariant;
};

/** A single week of a block: its 1-based index, whether it is a scheduled
 *  deload, and the concrete workouts it prescribes. */
export type BlockWeek = {
  isDeload: boolean;
  week: number;
  workouts: readonly WeekWorkout[];
};

/** What happens when a block finishes: roll into the next block, complete the
 *  program (a bounded final block), or nothing to announce (a repeating block
 *  that just keeps cycling). */
export enum BlockOutcomeKind {
  NextBlock,
  ProgramComplete,
  RepeatsIndefinitely,
}

export const BlockOutcome = {
  NextBlock: (block: TrainingBlock) => ({
    block,
    kind: BlockOutcomeKind.NextBlock as const,
  }),
  ProgramComplete: () => ({ kind: BlockOutcomeKind.ProgramComplete as const }),
  RepeatsIndefinitely: () => ({
    kind: BlockOutcomeKind.RepeatsIndefinitely as const,
  }),
};

export type BlockOutcome = ReturnType<
  (typeof BlockOutcome)[keyof typeof BlockOutcome]
>;

/**
 * Pair each program with its latest version for the explorer index. Programs
 * without any version are dropped; the result is ordered by program name.
 */
export const latestPrograms = (
  programs: readonly Program[],
  versions: readonly ProgramVersion[],
): readonly ProgramWithVersion[] =>
  programs
    .flatMap((program) => {
      const version = latestVersionFor(program.id, versions);
      return version === undefined ? [] : [{ program, version }];
    })
    .sort((a, b) => a.program.name.localeCompare(b.program.name));

/**
 * The workouts a block schedules across its week, ordered by weekday. Throws
 * when a scheduled day references a template the version doesn't define — a
 * program-authoring bug, surfaced rather than swallowed.
 */
export const blockSchedule = (
  version: ProgramVersion,
  block: TrainingBlock,
): readonly ScheduledWorkout[] =>
  [...block.weekTemplate.days]
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    .map((day) => ({
      dayOfWeek: day.dayOfWeek,
      template: templateById(version, day.sessionTemplateId),
    }));

/**
 * Every rotation a session template prescribes: one unlabeled entry for a fixed
 * template, or one labeled entry per variant for a rotating one. Reuses the
 * engine's variant selection so the explorer shows exactly what the scheduler
 * would pick each week.
 */
export const sessionRotations = (
  template: SessionTemplate,
): readonly SelectedVariant[] => {
  const count = template.variants?.length ?? 1;
  return Array.from({ length: count }, (_, index) =>
    selectVariant(template, index + 1),
  );
};

/**
 * The block resolved week by week: one {@link BlockWeek} per training week, each
 * carrying the concrete workout the scheduler runs that week (the variant picked
 * for the week, not every rotation at once) and whether the week is a scheduled
 * deload. This is how the detail view sections a per-week-varying block — Week 1
 * reads exactly as Week 1 runs.
 */
export const blockWeekSchedules = (
  version: ProgramVersion,
  block: TrainingBlock,
): readonly BlockWeek[] =>
  Array.from({ length: block.durationWeeks }, (_, index) => {
    const week = index + 1;
    return {
      isDeload:
        block.deloadEveryWeeks !== undefined &&
        week % block.deloadEveryWeeks === 0,
      week,
      workouts: [...block.weekTemplate.days]
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
        .map((day) => {
          const template = templateById(version, day.sessionTemplateId);
          return {
            dayOfWeek: day.dayOfWeek,
            template,
            variant: selectVariant(template, week),
          };
        }),
    };
  });

/**
 * Whether the detail view sections a block week by week. Only a `"progression"`
 * block — one whose weeks are a distinct, bounded arc — is shown this way; a
 * repeating block (the default) keeps the same shape every week, so it reads as
 * one weekly schedule. This is authored on the block, not inferred: a repeating
 * block may still rotate a conditioning day or deload without its weeks being
 * "fundamentally different".
 */
export const showsWeekSections = (block: TrainingBlock): boolean =>
  block.weekStructure === "progression";

/**
 * A one-line summary of a week's distinct session labels, for the collapsed
 * week header — e.g. "Full Body A · Steady 10k". Fixed (unlabeled) days are
 * skipped and a leading "Week N · " prefix is dropped so the summary doesn't
 * restate the week it heads.
 */
export const blockWeekSummary = (week: BlockWeek): string => {
  const labels = week.workouts.flatMap((workout) =>
    workout.variant.label === undefined
      ? []
      : [stripWeekPrefix(workout.variant.label)],
  );
  return [...new Set(labels)].join(" · ");
};

/**
 * What the athlete reaches when a block completes: the next block in the
 * version, the end of the program (a bounded final block), or nothing to
 * announce (a repeating final block that just keeps cycling). Throws when the
 * block is not part of the version — a caller bug, surfaced rather than
 * swallowed.
 */
export const blockOutcome = (
  version: ProgramVersion,
  block: TrainingBlock,
): BlockOutcome => {
  const index = version.blocks.findIndex((entry) => entry.id === block.id);
  if (index === -1) {
    throw new Error(
      `block ${block.id} is not part of program version ${version.id}`,
    );
  } else {
    return outcomeAfter(version.blocks[index + 1], block);
  }
};

/**
 * Resolve a `(versionId, blockId)` pair to its full context, or `undefined`
 * when any part is missing so the caller can render a not-found response.
 */
export const findBlockContext = (
  programs: readonly Program[],
  versions: readonly ProgramVersion[],
  versionId: string,
  blockId: string,
): BlockContext | undefined => {
  const version = versions.find((entry) => entry.id === versionId);
  if (version === undefined) {
    return undefined;
  } else {
    const block = version.blocks.find((entry) => entry.id === blockId);
    const program = programs.find((entry) => entry.id === version.programId);
    return block === undefined || program === undefined
      ? undefined
      : { block, program, version };
  }
};

const latestVersionFor = (
  programId: string,
  versions: readonly ProgramVersion[],
): ProgramVersion | undefined =>
  versions
    .filter((version) => version.programId === programId)
    .reduce<ProgramVersion | undefined>(
      (best, version) =>
        best === undefined || version.version > best.version ? version : best,
      undefined,
    );

/** The outcome for a block given the block that follows it (if any): roll into
 *  the next block; otherwise complete the program (a bounded progression arc) or
 *  keep cycling (a repeating block). */
const outcomeAfter = (
  next: TrainingBlock | undefined,
  block: TrainingBlock,
): BlockOutcome => {
  if (next !== undefined) {
    return BlockOutcome.NextBlock(next);
  } else if (block.weekStructure === "progression") {
    return BlockOutcome.ProgramComplete();
  } else {
    return BlockOutcome.RepeatsIndefinitely();
  }
};

/** Drop a leading "Week N · " from a variant label so a week section doesn't
 *  restate the week number it already heads (e.g. "Week 1 · Full Body A" →
 *  "Full Body A"). */
export const stripWeekPrefix = (label: string): string => {
  const last = label.split("·").at(-1);
  return last === undefined ? label : last.trim();
};

const templateById = (version: ProgramVersion, id: string): SessionTemplate => {
  const template = version.sessionTemplates.find((entry) => entry.id === id);
  if (template === undefined) {
    throw new Error(
      `session template ${id} missing from program version ${version.id}`,
    );
  } else {
    return template;
  }
};
