import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCierres } from "@/lib/data/cierres";
import { getMesOperativo } from "@/lib/services/config.service";
import { CerrarMesForm, ReopenMesButton } from "./CierresClientForms";
import Link from "next/link";

const ESTADO_CLS: Record<string, string> = {
  CERRADO:   "bg-emerald-100 text-emerald-700",
  REABIERTO: "bg-amber-100 text-amber-700",
  ABIERTO:   "bg-slate-100 text-slate-600",
};

function fmt(n: number | null | undefined, dec = 0) {
  if (n == null) return "—";
  return n.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function CierresPage() {
  const session = await auth() as { user?: { id?: string; role?: string } } | null;
  if (session?.user?.role !== "ADMIN") redirect("/inicio");

  const [cierres, mesActual] = await Promise.all([getCierres(), getMesOperativo()]);

  return (
    <div className="flex flex-col gap-8 pb-20 max-w-5xl">
      <header>
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Sistema</p>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Cierre Mensual</h1>
        <p className="text-sm text-slate-400 font-medium mt-1">
          Congela el estado financiero de un mes. Los reportes de meses cerrados usan snapshots.
        </p>
      </header>

      <CerrarMesForm mesSugerido={mesActual} />

      {/* Lista de cierres */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-700">
            Historial de cierres
          </h2>
        </div>

        {cierres.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-400 italic text-center">Sin cierres registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["Mes", "Estado", "TC Blue", "TC MEP", "Fecha cierre", "Usuario", "Notas", "Acciones"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ${i === 0 ? "text-left" : i >= 5 ? "text-left" : "text-right"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cierres.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-black text-slate-800">{c.mes}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${ESTADO_CLS[c.estado] ?? "bg-slate-100 text-slate-500"}`}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono text-slate-700">
                      {c.tcBlue != null ? `$ ${fmt(Number(c.tcBlue))}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono text-slate-700">
                      {c.tcMep != null ? `$ ${fmt(Number(c.tcMep))}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-500 whitespace-nowrap">
                      {fmtDate(c.fechaCierre)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.User?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-400 max-w-[160px] truncate">{c.notas ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Link
                          href={`/reportes/mensual?mes=${c.mes}`}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors whitespace-nowrap"
                        >
                          {c.estado === "CERRADO" ? "Ver snapshot →" : "Ver reporte →"}
                        </Link>
                        {c.estado === "CERRADO" && <ReopenMesButton mes={c.mes} />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Snapshot breakdown del último cierre */}
      {cierres.length > 0 && cierres[0].estado === "CERRADO" && (() => {
        const snap = cierres[0].snapshotData as Record<string, unknown> | null;
        const ap = snap?.apertura as Record<string, number> | undefined;
        if (!ap) return null;
        const items: [string, number, string][] = [
          ["Caja USD disponible",   ap.usdDisponible,  "USD"],
          ["Cartera USD propia",    ap.usdActivos,     "USD"],
          ["Apertura USD neto BYG", ap.usdNeto,        "USD"],
          ["PF clientes USD",       ap.pfClientesUSD,  "USD"],
          ["Custodia USD (inform.)",ap.custodiaUSD,    "USD"],
          ["ARS neto BYG",          ap.arsNeto,        "ARS"],
        ];
        return (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                Snapshot más reciente — {cierres[0].mes}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-slate-100">
              {items.map(([label, val, mon]) => (
                <div key={label} className="bg-white px-5 py-4 flex flex-col gap-0.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                  <p className="text-lg font-black tabular-nums text-slate-800">
                    {fmt(val, 2)} <span className="text-[10px] font-medium text-slate-400">{mon}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>
        );
      })()}
    </div>
  );
}
