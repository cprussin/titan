import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { apiAuthGuard } from "../../../../../../auth/session";
import { db } from "../../../../../../db";
import { deleteBlock } from "../../../../../../server/delete-block";

export const DELETE = async (
  _request: Request,
  context: { params: Promise<{ blockId: string; versionId: string }> },
): Promise<Response> => {
  const guard = await apiAuthGuard();
  if (guard === undefined) {
    const { blockId, versionId } = await context.params;
    await deleteBlock(db, versionId, blockId);
    // The mint replaces the program's latest version, which drives the programs
    // index, today's plan, and the block views under the root layout — purge
    // them all. Route handlers don't revalidate on their own.
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } else {
    return guard;
  }
};
