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
