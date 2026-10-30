import { auth } from "@/auth";
import { isCurrentAdmin } from "@/lib/auth/permissions";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE = "byg_preview_user";

export async function POST(req: Request) {
  const { userId } = (await req.json()) as { userId: string };
  const store = await cookies();

  // Limpiar la cookie propia: cualquier sesión autenticada (solo borra, nunca fija).
  if (!userId) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    store.delete(COOKIE);
    return NextResponse.json({ ok: true });
  }

  // Fijar "ver como": ADMIN vigente según DB (no el rol del JWT, que puede estar desactualizado).
  if (!(await isCurrentAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  store.set(COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return NextResponse.json({ ok: true });
}
