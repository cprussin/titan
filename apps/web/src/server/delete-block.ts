import { randomUUID } from "node:crypto";
import type { Db } from "@titan/db/client";
import {
  getProgramVersion as defaultGetProgramVersion,
  upsertProgramVersion as defaultUpsertProgramVersion,
} from "@titan/db/program-versions";
import type { ProgramVersion } from "@titan/domain/program";

/**
 * Delete a block from a program by minting a new {@link ProgramVersion} that
 * omits it. Program versions are immutable — workouts keep referencing the
 * version they were prescribed from — so a deletion edits the program forward
 * rather than mutating history in place. The db reads/writes and the id/clock
 * sources are injected so the orchestration is unit-testable (see TESTING.md).
 */
export const deleteBlock = async (
  db: Db,
  versionId: string,
  blockId: string,
  getProgramVersion: typeof defaultGetProgramVersion = defaultGetProgramVersion,
  upsertProgramVersion: typeof defaultUpsertProgramVersion = defaultUpsertProgramVersion,
  newId: () => string = randomUUID,
  now: () => string = () => new Date().toISOString(),
): Promise<void> => {
  const version = await getProgramVersion(db, versionId);
  if (version === undefined) {
    throw new Error(`program version ${versionId} not found`);
  } else {
    await upsertProgramVersion(
      db,
      blockRemovedVersion(version, blockId, newId(), now()),
    );
  }
};

/** The next version of `version` with `blockId` removed: a fresh id and creation
 *  time, the incremented version number, and its session templates pruned to
 *  those the surviving blocks still reference. Throws when the block isn't part
 *  of the version, a caller bug surfaced rather than swallowed. */
const blockRemovedVersion = (
  version: ProgramVersion,
  blockId: string,
  id: string,
  createdAt: string,
): ProgramVersion => {
  const blocks = version.blocks.filter((block) => block.id !== blockId);
  if (blocks.length === version.blocks.length) {
    throw new Error(
      `block ${blockId} missing from program version ${version.id}`,
    );
  } else {
    const referenced = new Set(
      blocks.flatMap((block) =>
        block.weekTemplate.days.map((day) => day.sessionTemplateId),
      ),
    );
    return {
      ...version,
      blocks,
      createdAt,
      id,
      sessionTemplates: version.sessionTemplates.filter((template) =>
        referenced.has(template.id),
      ),
      version: version.version + 1,
    };
  }
};
