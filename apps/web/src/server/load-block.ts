import type { Db } from "@titan/db/client";
import { listPrograms, listProgramVersions } from "@titan/db/program-versions";
import type { BlockData } from "../components/BlockContent";
import { isActiveBlock } from "./active-block";
import { athletePosition } from "./athlete-position";
import { exerciseNames } from "./exercise-names";
import { findBlockContext } from "./program-explorer";

/** One training block's week-by-week prescription, or `undefined` when no such
 *  block exists. Shared by the block page and the Android app's endpoint. */
export const loadBlock = async (
  db: Db,
  userId: string,
  today: string,
  versionId: string,
  blockId: string,
): Promise<BlockData | undefined> => {
  const [programs, versions, names, position] = await Promise.all([
    listPrograms(db),
    listProgramVersions(db),
    exerciseNames(db),
    athletePosition(db, userId, today),
  ]);
  const context = findBlockContext(programs, versions, versionId, blockId);
  return context === undefined
    ? undefined
    : {
        active: isActiveBlock(position, context.version, blockId),
        context,
        names,
      };
};
