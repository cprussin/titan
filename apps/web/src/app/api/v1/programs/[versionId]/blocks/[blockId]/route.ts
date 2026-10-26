import { NextResponse } from "next/server";
import { apiAuthGuard } from "../../../../../../../auth/session";
import { db } from "../../../../../../../db";
import { loadBlock } from "../../../../../../../server/load-block";
import { todayIso } from "../../../../../../../server/local-date";
import { wireJson } from "../../../../../../../server/wire-json";
import { USER_ID } from "../../../../../../../user";

/** One training block's plan — what the block page renders. */
export const GET = async (
  _request: Request,
  context: { params: Promise<{ blockId: string; versionId: string }> },
): Promise<Response> => {
  const guard = await apiAuthGuard();
  if (guard === undefined) {
    const { blockId, versionId } = await context.params;
    const block = await loadBlock(
      db,
      USER_ID,
      await todayIso(),
      versionId,
      blockId,
    );
    return block === undefined
      ? NextResponse.json({ error: "not found" }, { status: 404 })
      : NextResponse.json(wireJson(block));
  } else {
    return guard;
  }
};
