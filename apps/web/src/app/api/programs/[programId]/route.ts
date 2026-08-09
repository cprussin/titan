import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { apiAuthGuard } from "../../../../auth/session";
import { db } from "../../../../db";
import { deleteProgram } from "../../../../server/delete-program";

export const DELETE = async (
  _request: Request,
  context: { params: Promise<{ programId: string }> },
): Promise<Response> => {
  const guard = await apiAuthGuard();
  if (guard === undefined) {
    const { programId } = await context.params;
    await deleteProgram(db, programId);
    // A deletion removes or tombstones the program and can clear the athlete's
    // active pointer, all of which feed pages under the root layout — purge them
    // all. Route handlers don't revalidate on their own.
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } else {
    return guard;
  }
};
