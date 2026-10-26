import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "../../../../../../auth/session";
import { BlockContent } from "../../../../../../components/BlockContent";
import { db } from "../../../../../../db";
import { loadBlock } from "../../../../../../server/load-block";
import { todayIso } from "../../../../../../server/local-date";
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
  const data = await loadBlock(
    db,
    USER_ID,
    await todayIso(),
    versionId,
    blockId,
  );
  if (data === undefined) {
    notFound();
  } else {
    return <BlockContent load={{ isLoading: false, value: data }} />;
  }
};

export default BlockPage;
