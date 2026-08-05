import type {
  ProgramVersion,
  SessionConstraints,
  TrainingBlock,
} from "@titan/domain/program";

/**
 * The program's position for a given absolute training week and weekday: which
 * block and week-within-block it lands in, whether that week is a scheduled
 * deload, and which session (if any) the weekly template places on that day.
 */
export type ProgramPosition = {
  block: TrainingBlock;
  isDeloadWeek: boolean;
  /** `undefined` on a rest day (no session scheduled for this weekday). */
  sessionTemplateId: string | undefined;
  /** 1-based week within the block. */
  weekInBlock: number;
};

/**
 * Resolve the program position for `absoluteWeek` (1-based across the whole
 * program) and `dayOfWeek` (ISO 1=Mon…7=Sun). Returns `undefined` once the
 * program's blocks are exhausted.
 */
export const resolvePosition = (
  programVersion: ProgramVersion,
  absoluteWeek: number,
  dayOfWeek: number,
): ProgramPosition | undefined => {
  const located = locateBlock(programVersion.blocks, absoluteWeek);
  if (located === undefined) {
    return undefined;
  } else {
    const { block, weekInBlock } = located;
    const day = block.weekTemplate.days.find(
      (entry) => entry.dayOfWeek === dayOfWeek,
    );
    return {
      block,
      isDeloadWeek:
        block.deloadEveryWeeks !== undefined &&
        weekInBlock % block.deloadEveryWeeks === 0,
      sessionTemplateId: day?.sessionTemplateId,
      weekInBlock,
    };
  }
};

/**
 * Whether a session may run on `dayOfWeek` given the tags of the previous day's
 * session. Enforces the `allowedDays` window and the `avoidPreviousDayTags`
 * rule (e.g. a hard row can't follow heavy lower-body work).
 */
export const respectsConstraints = (
  constraints: SessionConstraints,
  dayOfWeek: number,
  previousDayTags: readonly string[],
): boolean => {
  const dayAllowed =
    constraints.allowedDays === undefined ||
    constraints.allowedDays.includes(dayOfWeek);
  const previousDayClear =
    constraints.avoidPreviousDayTags === undefined ||
    !constraints.avoidPreviousDayTags.some((tag) =>
      previousDayTags.includes(tag),
    );
  return dayAllowed && previousDayClear;
};

/**
 * Find the next weekday (after `fromDayOfWeek`, within the same week) a missed
 * session can move to: within its `allowedDays` window and where `isAvailable`
 * (occupancy + previous-day constraints the caller enforces) holds. Missed
 * workouts reschedule rather than disappear; `undefined` means no slot remains
 * this week.
 */
export const rescheduleMissed = (
  constraints: SessionConstraints,
  fromDayOfWeek: number,
  isAvailable: (dayOfWeek: number) => boolean,
): number | undefined => {
  const candidates = Array.from(
    { length: 7 - fromDayOfWeek },
    (_, offset) => fromDayOfWeek + 1 + offset,
  );
  return candidates.find(
    (day) =>
      (constraints.allowedDays === undefined ||
        constraints.allowedDays.includes(day)) &&
      isAvailable(day),
  );
};

const locateBlock = (
  blocks: readonly TrainingBlock[],
  absoluteWeek: number,
): { block: TrainingBlock; weekInBlock: number } | undefined => {
  const step = (
    remainingBlocks: readonly TrainingBlock[],
    weekOffset: number,
  ): { block: TrainingBlock; weekInBlock: number } | undefined => {
    const [head, ...tail] = remainingBlocks;
    if (head === undefined) {
      return undefined;
    } else if (absoluteWeek <= weekOffset + head.durationWeeks) {
      return { block: head, weekInBlock: absoluteWeek - weekOffset };
    } else {
      return step(tail, weekOffset + head.durationWeeks);
    }
  };
  return absoluteWeek < 1 ? undefined : step(blocks, 0);
};
