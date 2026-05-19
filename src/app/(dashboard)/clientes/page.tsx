import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/permissions";

export default async function ClientesPage() {
  await requirePermission("clientes:leer");
  redirect("/clientes/cc");
}
