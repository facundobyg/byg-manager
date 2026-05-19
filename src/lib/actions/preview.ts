"use server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const COOKIE = "byg_preview_user";

export async function setPreviewUser(userId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return;

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
