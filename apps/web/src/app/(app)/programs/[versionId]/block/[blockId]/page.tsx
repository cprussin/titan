import { getAthleteState } from "@titan/db/athlete-state";
import { listPrograms, listProgramVersions } from "@titan/db/program-versions";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockContent } from "../../../../../../components/BlockContent";
import { db } from "../../../../../../db";
import { isActiveBlock } from "../../../../../../server/active-block";
import { exerciseNames } from "../../../../../../server/exercise-names";
import { findBlockContext } from "../../../../../../server/program-explorer";
import { USER_ID } from "../../../../../../user";

export const metadata: Metadata = {
  description: "The prescription for this training block, week by week.",
  title: "Program block",
};

const BlockPage = async ({
  params,
}: {
  params: Promise<{ blockId: string; versionId: string }>;
}) => {
  const { blockId, versionId } = await params;
  const [programs, versions, names, state] = await Promise.all([
    listPrograms(db),
    listProgramVersions(db),
    exerciseNames(db),
    getAthleteState(db, USER_ID),
  ]);
  const context = findBlockContext(programs, versions, versionId, blockId);
  if (context === undefined) {
    notFound();
  } else {
    return (
      <BlockContent
        load={{
          isLoading: false,
          value: {
            active: isActiveBlock(state, context.version, blockId),
            context,
            names,
          },
        }}
      />
    );
  }
};

export default BlockPage;
