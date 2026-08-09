import { NextResponse } from "next/server";
import { apiAuthGuard } from "../../../auth/session";
import { db } from "../../../db";
import { deleteHistory } from "../../../server/delete-history";
import { USER_ID } from "../../../user";

export const DELETE = async (): Promise<Response> => {
  const guard = await apiAuthGuard();
  if (guard === undefined) {
    await deleteHistory(db, USER_ID);
    return NextResponse.json({ ok: true });
  } else {
    return guard;
  }
};
