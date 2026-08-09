import type { ProgramVersion } from "@titan/domain/program";

/**
 * The 1-based absolute training week at which `blockId` begins — one past the
 * summed duration of every block before it. Throws when the block isn't part of
 * the version, which the caller is expected to guarantee.
 */
export const blockStartWeek = (
  version: ProgramVersion,
  blockId: string,
): number => {
  const index = version.blocks.findIndex((block) => block.id === blockId);
  if (index === -1) {
    throw new Error(
      `block ${blockId} missing from program version ${version.id}`,
    );
  } else {
    return (
      version.blocks
        .slice(0, index)
        .reduce((weeks, block) => weeks + block.durationWeeks, 0) + 1
    );
  }
};

/**
 * The id of the block whose week window contains `absoluteWeek`, or `undefined`
 * when the week falls before the program starts or past its final block.
 */
export const activeBlockId = (
  version: ProgramVersion,
  absoluteWeek: number,
): string | undefined =>
  version.blocks.find((block) => {
    const start = blockStartWeek(version, block.id);
    return absoluteWeek >= start && absoluteWeek < start + block.durationWeeks;
  })?.id;

/**
 * Whether `blockId` of `version` is where the athlete currently sits: their
 * active version is this one and their absolute week falls within this block.
 */
export const isActiveBlock = (
  state: { absoluteWeek: number; programVersionId: string } | undefined,
  version: ProgramVersion,
  blockId: string,
): boolean =>
  state !== undefined &&
  state.programVersionId === version.id &&
  activeBlockId(version, state.absoluteWeek) === blockId;
