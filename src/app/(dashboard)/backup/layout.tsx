import { ReactNode } from "react";
import { requirePermission } from "@/lib/auth/permissions";

export default async function BackupLayout({ children }: { children: ReactNode }) {
  await requirePermission("backups:leer");
  return <>{children}</>;
}
