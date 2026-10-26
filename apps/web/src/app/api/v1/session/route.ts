import { NextResponse } from "next/server";
import { getSession } from "../../../../auth/session";

/** Who the app is signed in as — and, by answering 401 instead, that its token
 *  no longer signs anyone in. */
export const GET = async (): Promise<Response> => {
  const user = await getSession();
  return user === undefined
    ? NextResponse.json({ error: "unauthorized" }, { status: 401 })
    : NextResponse.json({ user });
};
