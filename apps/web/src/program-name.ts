import type { Program } from "@titan/domain/program";

/**
 * The display name of the program a placed version belongs to. The name lives
 * on the {@link Program} row, not on the version, so the dashboard resolves it
 * by id. Throws when no program matches — a placed version whose program row is
 * missing is a data-integrity bug, surfaced rather than papered over.
 */
export const programName = (
  programs: readonly Program[],
  programId: string,
): string => {
  const program = programs.find((entry) => entry.id === programId);
  if (program === undefined) {
    throw new Error(`no program found for id ${programId}`);
  } else {
    return program.name;
  }
};
