import type { Db } from "@titan/db/client";
import { listPrograms, listProgramVersions } from "@titan/db/program-versions";
import type { TrainingBlock } from "@titan/domain/program";
import type {
  ProgramCardData,
  ProgramsData,
} from "../components/ProgramsContent";
import { isActiveBlock } from "./active-block";
import type { AthletePosition } from "./athlete-position";
import { athletePosition } from "./athlete-position";
import type { ProgramWithVersion } from "./program-explorer";
import { latestPrograms } from "./program-explorer";

/** The program explorer: the active program first, then the rest. Shared by the
 *  programs page and the Android app's `/api/v1/programs`. */
export const loadPrograms = async (
  db: Db,
  userId: string,
  today: string,
): Promise<ProgramsData> => {
  const [programs, versions, position] = await Promise.all([
    listPrograms(db),
    listProgramVersions(db),
    athletePosition(db, userId, today),
  ]);
  const entries = latestPrograms(programs, versions);
  const activeEntry = entries.find(
    (entry) => entry.version.id === position?.programVersionId,
  );
  const others = entries.filter((entry) => entry !== activeEntry);
  return {
    active:
      activeEntry === undefined
        ? undefined
        : programCard(activeEntry, position),
    others: others.map((entry) => programCard(entry, position)),
  };
};

/** One program's card model: its header fields and its blocks, each block
 *  carrying the summary line and whether it is the athlete's active block. */
const programCard = (
  { program, version }: ProgramWithVersion,
  position: AthletePosition | undefined,
): ProgramCardData => ({
  blocks: version.blocks.map((block) => ({
    active: isActiveBlock(position, version, block.id),
    id: block.id,
    meta: describeBlock(block),
    name: block.name,
    versionId: version.id,
  })),
  description: program.description,
  goals: program.goals,
  name: program.name,
  versionId: version.id,
});

/** A one-line summary of a block's length and deload cadence. */
const describeBlock = (block: TrainingBlock): string => {
  const weeks = `${block.durationWeeks} week${block.durationWeeks === 1 ? "" : "s"}`;
  return block.deloadEveryWeeks === undefined
    ? weeks
    : `${weeks} · deload every ${block.deloadEveryWeeks} weeks`;
};
