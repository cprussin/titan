import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiAuthGuard } from "../../../auth/session";
import { db } from "../../../db";
import { selectActiveBlock } from "../../../server/select-active-block";
import { USER_ID } from "../../../user";

const bodySchema = z.object({ blockId: z.string(), versionId: z.string() });

export const POST = async (request: Request): Promise<Response> => {
  const guard = await apiAuthGuard();
  if (guard === undefined) {
    const { blockId, versionId } = bodySchema.parse(await request.json());
    await selectActiveBlock(db, USER_ID, versionId, blockId);
    // Athlete state drives every page under the root layout — today's plan,
    // the programs index, the block views — so purge them all, not just the
    // page the request came from. Route handlers don't revalidate on their own.
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } else {
    return guard;
  }
};
