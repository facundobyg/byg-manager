import { auth } from "@/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE = "byg_preview_user";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = (await req.json()) as { userId: string };
  const store = await cookies();

  if (!userId) {
    store.delete(COOKIE);
  } else {
    store.set(COOKIE, userId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
  }

  return NextResponse.json({ ok: true });
}
