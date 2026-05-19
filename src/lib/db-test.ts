import { prisma } from "@/lib/prisma";

export async function testDB(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (e) {
    console.error("DB ERROR:", e);
    return false;
  }
}
