import { setAthleteState as defaultSetAthleteState } from "@titan/db/athlete-state";
import type { Db } from "@titan/db/client";
import { getProgramVersion as defaultGetProgramVersion } from "@titan/db/program-versions";
import { blockStartWeek } from "./active-block";

/**
 * Make a program block the athlete's active position: point their state at the
 * block's version and reset their absolute week to that block's first week.
 * Selecting a program is selecting its opening block. The db reads/writes are
 * injected so the orchestration is unit-testable (see TESTING.md).
 */
export const selectActiveBlock = async (
  db: Db,
  userId: string,
  versionId: string,
  blockId: string,
  getProgramVersion: typeof defaultGetProgramVersion = defaultGetProgramVersion,
  setAthleteState: typeof defaultSetAthleteState = defaultSetAthleteState,
  now: () => string = () => new Date().toISOString(),
): Promise<void> => {
  const version = await getProgramVersion(db, versionId);
  if (version === undefined) {
    throw new Error(`program version ${versionId} not found`);
  } else {
    await setAthleteState(db, {
      absoluteWeek: blockStartWeek(version, blockId),
      programVersionId: versionId,
      updatedAt: now(),
      userId,
    });
  }
};
