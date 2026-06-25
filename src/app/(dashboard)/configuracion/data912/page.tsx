import Link from "next/link";
import { auth } from "@/auth";
import { requirePermission } from "@/lib/auth/permissions";
import { getData912Status } from "./actions";
import { Data912Panel } from "@/components/modules/configuracion/Data912Panel";

export default async function Data912AdminPage() {
  await requirePermission("configuracion:leer");

  const [session, status] = await Promise.all([auth(), getData912Status()]);
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";

  return (
    <div className="flex flex-col gap-8 pb-20 max-w-3xl">
      <header>
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Sistema</p>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Data912 — Actualización de precios</h1>
        <p className="text-sm text-slate-400 font-medium mt-1">
          Previsualizar y sincronizar precios de mercado contra Data912.
        </p>
      </header>

      <Data912Panel initialStatus={status} isAdmin={isAdmin} />

      <Link href="/configuracion" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
        ← Volver a Configuración
      </Link>
    </div>
  );
}
