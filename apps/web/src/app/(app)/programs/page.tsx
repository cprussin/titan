import type { AthleteState } from "@titan/db/athlete-state";
import { getAthleteState } from "@titan/db/athlete-state";
import { listPrograms, listProgramVersions } from "@titan/db/program-versions";
import type { TrainingBlock } from "@titan/domain/program";
import type { Metadata } from "next";
import type { ProgramCardData } from "../../../components/ProgramsContent";
import { ProgramsContent } from "../../../components/ProgramsContent";
import { db } from "../../../db";
import { isActiveBlock } from "../../../server/active-block";
import type { ProgramWithVersion } from "../../../server/program-explorer";
import { latestPrograms } from "../../../server/program-explorer";
import { USER_ID } from "../../../user";

export const metadata: Metadata = {
  description: "Browse training programs and choose your active block.",
  title: "Programs",
};

const ProgramsPage = async () => {
  const [programs, versions, state] = await Promise.all([
    listPrograms(db),
    listProgramVersions(db),
    getAthleteState(db, USER_ID),
  ]);
  const entries = latestPrograms(programs, versions);
  const activeEntry = entries.find(
    (entry) => entry.version.id === state?.programVersionId,
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
              : programCard(activeEntry, state),
          others: others.map((entry) => programCard(entry, state)),
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
  state: AthleteState | undefined,
): ProgramCardData => ({
  blocks: version.blocks.map((block) => ({
    active: isActiveBlock(state, version, block.id),
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
