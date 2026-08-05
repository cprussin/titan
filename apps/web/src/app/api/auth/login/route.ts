import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "../../../../auth/session";
import { signToken } from "../../../../auth/token";
import { env } from "../../../../env";

const bodySchema = z.object({ password: z.string() });
const THIRTY_DAYS_SEC = 60 * 60 * 24 * 30;

export const POST = async (request: Request): Promise<Response> => {
  const body = bodySchema.parse(await request.json());
  if (body.password === env.AUTH_PASSWORD) {
    const store = await cookies();
    store.set(SESSION_COOKIE, signToken(env.AUTH_SESSION_SECRET), {
      httpOnly: true,
      maxAge: THIRTY_DAYS_SEC,
      path: "/",
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
    });
    return NextResponse.json({ ok: true });
  } else {
    return NextResponse.json({ error: "invalid password" }, { status: 401 });
  }
};
