import { listPrograms, listProgramVersions } from "@titan/db/program-versions";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "../../../../../../auth/session";
import { BlockContent } from "../../../../../../components/BlockContent";
import { db } from "../../../../../../db";
import { isActiveBlock } from "../../../../../../server/active-block";
import { athletePosition } from "../../../../../../server/athlete-position";
import { exerciseNames } from "../../../../../../server/exercise-names";
import { todayIso } from "../../../../../../server/local-date";
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
  await requireAuth();
  const { blockId, versionId } = await params;
  const today = await todayIso();
  const [programs, versions, names, position] = await Promise.all([
    listPrograms(db),
    listProgramVersions(db),
    exerciseNames(db),
    athletePosition(db, USER_ID, today),
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
            active: isActiveBlock(position, context.version, blockId),
            context,
            names,
          },
        }}
      />
    );
  }
};

export default BlockPage;
