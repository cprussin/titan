import { listPrograms, listProgramVersions } from "@titan/db/program-versions";
import type { TrainingBlock } from "@titan/domain/program";
import type { Metadata } from "next";
import { requireAuth } from "../../../auth/session";
import type { ProgramCardData } from "../../../components/ProgramsContent";
import { ProgramsContent } from "../../../components/ProgramsContent";
import { db } from "../../../db";
import { isActiveBlock } from "../../../server/active-block";
import type { AthletePosition } from "../../../server/athlete-position";
import { athletePosition } from "../../../server/athlete-position";
import { todayIso } from "../../../server/local-date";
import type { ProgramWithVersion } from "../../../server/program-explorer";
import { latestPrograms } from "../../../server/program-explorer";
import { USER_ID } from "../../../user";

export const metadata: Metadata = {
  description: "Browse training programs and choose your active block.",
  title: "Programs",
};

const ProgramsPage = async () => {
  await requireAuth();
  const today = await todayIso();
  const [programs, versions, position] = await Promise.all([
    listPrograms(db),
    listProgramVersions(db),
    athletePosition(db, USER_ID, today),
  ]);
  const entries = latestPrograms(programs, versions);
  const activeEntry = entries.find(
    (entry) => entry.version.id === position?.programVersionId,
  );
  const others = entries.filter((entry) => entry !== activeEntry);

  return (
    <ProgramsContent
      load={{
        isLoading: false,
        value: {
          active:
            activeEntry === undefined
              ? undefined
              : programCard(activeEntry, position),
          others: others.map((entry) => programCard(entry, position)),
        },
      }}
    />
  );
};

export default ProgramsPage;

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
