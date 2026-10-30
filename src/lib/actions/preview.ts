"use server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { isCurrentAdmin } from "@/lib/auth/permissions";
import { revalidatePath } from "next/cache";

const COOKIE = "byg_preview_user";

/** Fijar (o limpiar) "ver como": solo ADMIN vigente según DB (no el rol del JWT). */
export async function setPreviewUser(userId: string) {
  if (!(await isCurrentAdmin())) return;

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

  revalidatePath("/", "layout");
}

/**
 * Limpiar la cookie PROPIA de "ver como": cualquier sesión autenticada (p. ej.
 * un ex-ADMIN degradado que quedó con la cookie). Solo borra; nunca fija.
 */
export async function clearPreviewUser() {
  const session = await auth();
  if (!session?.user?.id) return;
  const store = await cookies();
  store.delete(COOKIE);
  revalidatePath("/", "layout");
}
