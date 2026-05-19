import { getResumenConsolidado, getExposicionPorMoneda, getBalanceGeneral, getExposicionPorCliente } from "@/lib/data/reportes";
import Link from "next/link";
import { ExportCsvButton } from "@/components/modules/reportes/ExportCsvButton";
import { Decimal } from "@prisma/client/runtime/library";
import { requirePermission } from "@/lib/auth/permissions";

function fmt(n: Decimal) {
  return Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}


const MONEDA_CLS: Record<string, { badge: string; row: string }> = {
  USD: { badge: "bg-emerald-100 text-emerald-700", row: "bg-emerald-50/40" },
  ARS: { badge: "bg-blue-100 text-blue-700",       row: "bg-blue-50/40" },
  EUR: { badge: "bg-purple-100 text-purple-700",   row: "bg-purple-50/40" },
  BRL: { badge: "bg-amber-100 text-amber-700",     row: "bg-amber-50/40" },
};
const DEFAULT_CLS = { badge: "bg-slate-100 text-slate-600", row: "" };

function fmtN(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function ReportesPage() {
  await requirePermission("patrimonio:leer");
  const [r, exposicion, balance, expCliente] = await Promise.all([
    getResumenConsolidado(),
    getExposicionPorMoneda(),
    getBalanceGeneral(),
    getExposicionPorCliente(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Socios</p>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Reportes consolidados</h1>
        <p className="text-sm text-slate-400 font-medium mt-1">Vista ejecutiva general</p>
      </header>

      {/* ── Alertas operativas ──────────────────────────────────────────────── */}
      {(() => {
        const enRiesgo = expCliente.filter((c) => c.estado === "RIESGO").length;
        const mayor    = expCliente[0] ?? null;

        type Alert = { level: "ok" | "warn" | "error"; label: string; value: string; sub?: string };
        const alerts: Alert[] = [
          enRiesgo > 0
            ? { level: "error", label: "Clientes en riesgo", value: `${enRiesgo} cliente${enRiesgo > 1 ? "s" : ""}`, sub: "CC negativa" }
            : { level: "ok",    label: "Clientes en riesgo", value: "Sin riesgo",    sub: "CC positivas" },
          mayor
            ? { level: mayor.estado === "RIESGO" ? "error" : "ok", label: "Mayor exposición", value: mayor.clienteNombre, sub: fmtN(mayor.exposicionTotal) }
            : { level: "ok", label: "Mayor exposición", value: "Sin datos", sub: "" },
          balance.patrimonioNeto >= 0
            ? { level: "ok",    label: "Patrimonio neto", value: fmtN(balance.patrimonioNeto), sub: "Positivo" }
            : { level: "error", label: "Patrimonio neto", value: fmtN(Math.abs(balance.patrimonioNeto)), sub: "Negativo" },
        ];

        const CLS: Record<"ok" | "warn" | "error", { border: string; dot: string; label: string; val: string }> = {
          ok:    { border: "border-emerald-200", dot: "bg-emerald-400", label: "text-emerald-600", val: "text-emerald-800" },
          warn:  { border: "border-amber-200",   dot: "bg-amber-400",   label: "text-amber-600",   val: "text-amber-800"  },
          error: { border: "border-red-200",      dot: "bg-red-500",     label: "text-red-600",     val: "text-red-800"   },
        };

        return (
          <section className="flex flex-col gap-3">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Alertas operativas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {alerts.map((a) => {
                const c = CLS[a.level];
                return (
                  <div key={a.label} className={`bg-white rounded-xl border ${c.border} shadow-sm px-4 py-3 flex flex-col gap-1.5`}>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
                      <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${c.label}`}>{a.label}</p>
                    </div>
                    <p className={`text-sm font-black truncate ${c.val}`}>{a.value}</p>
                    {a.sub && <p className="text-[10px] text-slate-400 font-medium">{a.sub}</p>}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })()}

      {/* ── Balance General ─────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Balance General</h2>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-emerald-200 shadow-sm px-6 py-5 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Activo total</p>
            <p className="text-3xl font-black text-emerald-700 tabular-nums">
              {fmtN(balance.activoTotal)}
            </p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">USD equivalente</p>
          </div>
          <div className="bg-white rounded-xl border border-red-200 shadow-sm px-6 py-5 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Pasivo total</p>
            <p className="text-3xl font-black text-red-600 tabular-nums">
              {fmtN(balance.pasivoTotal)}
            </p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">USD equivalente</p>
          </div>
          <div className={`bg-white rounded-xl border shadow-sm px-6 py-5 flex flex-col gap-1 ${balance.patrimonioNeto >= 0 ? "border-emerald-300" : "border-red-300"}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${balance.patrimonioNeto >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              Patrimonio neto
            </p>
            <p className={`text-3xl font-black tabular-nums ${balance.patrimonioNeto >= 0 ? "text-emerald-700" : "text-red-600"}`}>
              {balance.patrimonioNeto >= 0 ? "" : "−"}{fmtN(Math.abs(balance.patrimonioNeto))}
            </p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Activo − Pasivo</p>
          </div>
        </div>

        {/* Detail tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Activo */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Activo</p>
            </div>
            <table className="w-full text-xs">
              <tbody>
                {[
                  { label: "Cajas",              value: balance.activo.cajas,             note: "" },
                  { label: "CC positivas",        value: balance.activo.cuentasCorrientes, note: "" },
                  { label: "Cartera propia",      value: balance.activo.cartera,           note: "" },
                  { label: "Custodia (inform.)",  value: balance.activo.custodia,          note: "no suma" },
                ].map(({ label, value, note }, i, arr) => (
                  <tr key={label} className={`border-b border-slate-50 last:border-0 ${note ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3 text-slate-600 font-medium">
                      {label}
                      {note && <span className="ml-1.5 text-[9px] text-slate-400 uppercase tracking-wider">{note}</span>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-emerald-700">{fmtN(value)}</td>
                    {i === arr.length - 1 && null}
                  </tr>
                ))}
                <tr className="border-t-2 border-emerald-200 bg-emerald-50">
                  <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-700">Total activo</td>
                  <td className="px-4 py-3 text-right tabular-nums font-black text-emerald-800 text-sm">{fmtN(balance.activoTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pasivo */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-red-50 border-b border-red-100 px-4 py-2.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Pasivo</p>
            </div>
            <table className="w-full text-xs">
              <tbody>
                {[
                  { label: "Plazos fijos activos", value: balance.pasivo.plazosFijos },
                  { label: "CC negativas",          value: balance.pasivo.cuentasNegativas },
                ].map(({ label, value }) => (
                  <tr key={label} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 text-slate-600 font-medium">{label}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-red-600">{fmtN(value)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-red-200 bg-red-50">
                  <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-600">Total pasivo</td>
                  <td className="px-4 py-3 text-right tabular-nums font-black text-red-700 text-sm">{fmtN(balance.pasivoTotal)}</td>
                </tr>
                <tr className={`border-t border-slate-200 ${balance.patrimonioNeto >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                  <td className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest ${balance.patrimonioNeto >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                    Patrimonio neto
                  </td>
                  <td className={`px-4 py-3 text-right tabular-nums font-black text-sm ${balance.patrimonioNeto >= 0 ? "text-emerald-800" : "text-red-700"}`}>
                    {balance.patrimonioNeto >= 0 ? "" : "−"}{fmtN(Math.abs(balance.patrimonioNeto))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>


      <section className="flex flex-col gap-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Exposición por moneda</h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Moneda", "Caja", "CC", "PF", "Total"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ${i === 0 ? "text-left" : "text-right"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {exposicion.map((row) => {
                const cls = MONEDA_CLS[row.moneda] ?? DEFAULT_CLS;
                return (
                  <tr key={row.moneda} className={`border-b border-slate-50 last:border-0 ${cls.row}`}>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${cls.badge}`}>
                        {row.moneda}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{fmtN(row.caja)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{fmtN(row.cuentasCorrientes)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{fmtN(row.plazosFijos)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-black text-slate-900">{fmtN(row.total)}</td>
                  </tr>
                );
              })}
              {exposicion.length > 1 && (() => {
                const totCaja = exposicion.reduce((s, r) => s + r.caja, 0);
                const totCC   = exposicion.reduce((s, r) => s + r.cuentasCorrientes, 0);
                const totPF   = exposicion.reduce((s, r) => s + r.plazosFijos, 0);
                const totTot  = exposicion.reduce((s, r) => s + r.total, 0);
                return (
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Total general</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-700">{fmtN(totCaja)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-700">{fmtN(totCC)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-700">{fmtN(totPF)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-black text-slate-900 text-sm">{fmtN(totTot)}</td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Patrimonio total</h2>
          <span className="text-[10px] text-slate-400 font-medium">TC Blue: {fmt(r.tcBlue)}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Patrimonio total ARS</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums">{fmt(r.patrimonioTotalARS)}</p>
          </div>
          <div className="bg-white rounded-xl border border-blue-100 shadow-sm px-6 py-5 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Patrimonio total USD</p>
            <p className="text-2xl font-black text-blue-700 tabular-nums">{fmt(r.patrimonioTotalUSD)}</p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Exposición por cliente</h2>
          <ExportCsvButton rows={expCliente} />
        </div>
        {expCliente.length > 0 && (() => {
          const mayor       = expCliente[0];
          const enRiesgo = expCliente.filter((r) => r.estado === "RIESGO").length;
          const totalExp = expCliente.reduce((s, r) => s + r.exposicionTotal, 0);
          return (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mayor exposición</p>
                <p className="text-sm font-black text-slate-800 truncate">{mayor.clienteNombre}</p>
                <p className="text-lg font-black text-slate-900 tabular-nums">{fmtN(mayor.exposicionTotal)}</p>
              </div>
              <div className="bg-white rounded-xl border border-red-200 shadow-sm px-5 py-4 flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">En riesgo</p>
                <p className="text-3xl font-black text-red-600 tabular-nums">{enRiesgo}</p>
                <p className="text-[10px] text-slate-400 font-medium">CC negativa</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Exposición total</p>
                <p className="text-lg font-black text-slate-900 tabular-nums">{fmtN(totalExp)}</p>
                <p className="text-[10px] text-slate-400 font-medium">{expCliente.length} clientes</p>
              </div>
            </div>
          );
        })()}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Cliente", "CC", "PF", "Custodia", "Exposición", ""].map((h, i) => (
                  <th
                    key={`ec-${i}`}
                    className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ${i === 0 || i === 5 ? "text-left" : "text-right"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expCliente.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic text-sm">Sin clientes</td>
                </tr>
              ) : expCliente.map((row) => {
                return (
                  <tr key={row.clienteId} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/clientes/${row.clienteId}`} className="text-slate-800 hover:text-blue-600 transition-colors">
                        {row.clienteNombre}
                      </Link>
                    </td>
                    <td className={`px-4 py-3 text-right tabular-nums ${row.ccSaldo < 0 ? "text-red-600 font-bold" : "text-slate-700"}`}>
                      {fmtN(row.ccSaldo)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{fmtN(row.plazosFijos)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{fmtN(row.custodia)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-black text-slate-900">{fmtN(row.exposicionTotal)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/clientes/${row.clienteId}`}
                        className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
