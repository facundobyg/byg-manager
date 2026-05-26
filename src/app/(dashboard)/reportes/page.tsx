import { getExposicionPorMoneda, getBalanceGeneral, getExposicionPorCliente } from "@/lib/data/reportes";
import { getUtilidadMes, getAperturaMoneda, getKPIsEjecutivos, getReporteProductores, getResumenPFCC } from "@/lib/data/reportes-ejecutivo";
import { getMesOperativo } from "@/lib/services/config.service";
import Link from "next/link";
import { ExportCsvButton } from "@/components/modules/reportes/ExportCsvButton";
import { requirePermission } from "@/lib/auth/permissions";

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

function fmtDate(d: Date) {
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function ReportesPage() {
  await requirePermission("patrimonio:leer");

  const mes = await getMesOperativo();
  const [exposicion, balance, expCliente, utilidad, apertura, kpis, productores, pfcc] = await Promise.all([
    getExposicionPorMoneda(),
    getBalanceGeneral(),
    getExposicionPorCliente(),
    getUtilidadMes(mes),
    getAperturaMoneda(),
    getKPIsEjecutivos(mes),
    getReporteProductores(mes),
    getResumenPFCC(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Socios</p>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Reportes ejecutivos</h1>
        <p className="text-sm text-slate-400 font-medium mt-1">
          Mes operativo: <strong className="text-slate-600">{mes}</strong>
          {" · "}TC Blue: <strong className="text-slate-600">{fmtN(apertura.tcBlue)}</strong>
        </p>
      </header>

      {/* ── Accesos rápidos ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Rep. Mensual",      href: `/reportes/mensual?mes=${mes}` },
          { label: "Comisiones",        href: `/comisiones?mes=${mes}` },
          { label: "PDF Clientes",      href: "/clientes/cc" },
          { label: "Rep. Productores",  href: "/comisiones" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="px-4 py-2 rounded-lg bg-byg-surface border border-byg-border text-xs font-bold text-byg-muted hover:text-byg-text hover:bg-byg-surface-2 transition-colors"
          >
            {l.label} →
          </Link>
        ))}
      </div>

      {/* ── KPIs Ejecutivos ─────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">KPIs del mes — {mes}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Clientes activos",   value: String(kpis.cantClientes),    color: "text-slate-900" },
            { label: "Comitentes activos", value: String(kpis.cantComitentes),  color: "text-slate-900" },
            { label: "Ops bolsa mes",      value: String(kpis.opsBolsaMes),     color: "text-blue-700" },
            { label: "Arbitrajes mes",     value: String(kpis.arbsMes),         color: "text-violet-700" },
            { label: "PF activos",         value: String(kpis.pfActivos),       color: "text-emerald-700" },
            { label: "PF vencidos",        value: String(kpis.pfVencidos),      color: kpis.pfVencidos > 0 ? "text-red-600" : "text-slate-400" },
            { label: "Vencen en 30d",      value: String(kpis.pfProximos),      color: kpis.pfProximos > 0 ? "text-amber-600" : "text-slate-400" },
            { label: "CCs",                value: String(kpis.ccCount),         color: "text-slate-700" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex flex-col gap-1">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{label}</p>
              <p className={`text-2xl font-black tabular-nums ${color}`}>{value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-emerald-200 shadow-sm px-4 py-3 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600">Comisiones mes (ARS)</p>
            <p className="text-xl font-black tabular-nums text-emerald-700">{fmtN(kpis.comisionesMes)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Ops propias / cartera</p>
            <p className="text-xl font-black tabular-nums text-slate-700">{kpis.opsPropias}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Tasa PF promedio</p>
            <p className="text-xl font-black tabular-nums text-slate-700">
              {kpis.pfTasaPromedio != null ? `${fmtN(kpis.pfTasaPromedio)}%` : "—"}
            </p>
          </div>
        </div>
      </section>

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

      {/* ── Utilidad Real del Mes ───────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Utilidad real del mes — {mes}</h2>
        <p className="text-[10px] text-slate-400 font-medium -mt-2">
          La utilidad depende de clasificar correctamente ingresos/egresos. No duplicar honorarios o comisiones ya cargados como operación de cambio.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className={`bg-white rounded-xl border shadow-sm px-5 py-4 flex flex-col gap-1 ${utilidad.utilidadTotalUSD >= 0 ? "border-emerald-300" : "border-red-300"}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${utilidad.utilidadTotalUSD >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              Utilidad total USD
            </p>
            <p className={`text-2xl font-black tabular-nums ${utilidad.utilidadTotalUSD >= 0 ? "text-emerald-700" : "text-red-600"}`}>
              {utilidad.utilidadTotalUSD >= 0 ? "+" : ""}{fmtN(utilidad.utilidadTotalUSD)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Cambio FX (USD eq.)</p>
            <p className={`text-xl font-black tabular-nums ${utilidad.cambioUSD >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {utilidad.cambioUSD >= 0 ? "+" : ""}{fmtN(utilidad.cambioUSD)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Arbitrajes ARS</p>
            <p className={`text-xl font-black tabular-nums ${utilidad.arbitrajesARS >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {utilidad.arbitrajesARS >= 0 ? "+" : ""}{fmtN(utilidad.arbitrajesARS)}
            </p>
            {utilidad.arbitrajesUSD !== 0 && (
              <p className={`text-[11px] font-bold tabular-nums ${utilidad.arbitrajesUSD >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {utilidad.arbitrajesUSD >= 0 ? "+" : ""}{fmtN(utilidad.arbitrajesUSD)} USD
              </p>
            )}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Ingresos − Egresos ARS</p>
            <p className={`text-xl font-black tabular-nums ${utilidad.ingresosARS - utilidad.egresosARS >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {fmtN(utilidad.ingresosARS - utilidad.egresosARS)}
            </p>
          </div>
        </div>
        {(utilidad.ingresosItems.length > 0 || utilidad.egresosItems.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {utilidad.ingresosItems.length > 0 && (
              <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden">
                <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Ingresos operativos</p>
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    {utilidad.ingresosItems.map((it, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-2.5 text-slate-600">{it.label}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-bold text-emerald-700">{fmtN(it.montoARS)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {utilidad.egresosItems.length > 0 && (
              <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
                <div className="bg-red-50 border-b border-red-100 px-4 py-2.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Egresos operativos</p>
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    {utilidad.egresosItems.map((it, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-2.5 text-slate-600">{it.label}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-bold text-red-600">{fmtN(it.montoARS)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Apertura Moneda Real ────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Posición financiera BYG</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Apertura USD BYG",    value: apertura.usdNeto,        color: apertura.usdNeto >= 0 ? "text-emerald-700" : "text-red-600" },
            { label: "Caja USD",            value: apertura.usdDisponible,  color: "text-slate-700" },
            { label: "Cartera USD",         value: apertura.usdActivos,     color: "text-slate-700" },
            { label: "Recobros USD",        value: apertura.ccUSDRecobros,  color: apertura.ccUSDRecobros > 0 ? "text-emerald-700" : "text-slate-400" },
            { label: "Pasivo USD clientes", value: apertura.usdDeuda,       color: apertura.usdDeuda > 0 ? "text-red-600" : "text-slate-400" },
            { label: "ARS neto BYG",        value: apertura.arsNeto,        color: apertura.arsNeto >= 0 ? "text-blue-700" : "text-red-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex flex-col gap-1">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{label}</p>
              <p className={`text-lg font-black tabular-nums ${color}`}>{fmtN(value)}</p>
            </div>
          ))}
        </div>
        {/* USD administrado clientes — B4 */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 px-4 py-2.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Administrado clientes
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
            {[
              { label: "PF USD clientes",  value: apertura.pfClientesUSD,    moneda: "USD" },
              { label: "PF ARS clientes",  value: apertura.pfClientesARS,    moneda: "ARS" },
              { label: "CC USD pos.",      value: apertura.ccClientesUSDPos, moneda: "USD" },
              { label: "Custodia USD",     value: apertura.custodiaUSD,      moneda: "USD" },
            ].map(({ label, value, moneda }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <p className="text-[10px] font-black uppercase text-slate-400">{label}</p>
                <p className="text-sm font-black tabular-nums text-slate-600">
                  {fmtN(value)} <span className="text-[10px] font-medium text-slate-400">{moneda}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Balance General ─────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Balance General</h2>

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
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
              </tbody>
            </table>
          </div>
        </div>

        {/* Patrimonio Neto — cierre visual debajo de ambas tablas */}
        <div className={`rounded-xl border px-6 py-4 flex items-center justify-between ${balance.patrimonioNeto >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
          <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${balance.patrimonioNeto >= 0 ? "text-emerald-700" : "text-red-600"}`}>
            Patrimonio Neto · Activo − Pasivo
          </p>
          <p className={`text-2xl font-black tabular-nums ${balance.patrimonioNeto >= 0 ? "text-emerald-800" : "text-red-700"}`}>
            {balance.patrimonioNeto >= 0 ? "" : "−"}{fmtN(Math.abs(balance.patrimonioNeto))}
          </p>
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

      {/* ── Productores ─────────────────────────────────────────────────────── */}
      {productores.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Productores — {mes}</h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["Productor", "Ops", "Clientes", "Comis. ARS", "Comis. USD", "SENEBI bruto"].map((h, i) => (
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
                {productores.map((p) => (
                  <tr key={p.productor} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-black text-slate-800">{p.productor}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{p.ops}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{p.clientes}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-emerald-700">{fmtN(p.comisionARS)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-emerald-700">{fmtN(p.comisionUSD)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{fmtN(p.senebiBruto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Exposición por cliente ───────────────────────────────────────────── */}
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
                {["Cliente", "CC (USD eq.)", "PF (USD eq.)", "Custodia", "Total USD eq.", ""].map((h, i) => (
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

      {/* ── PF / CC ─────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Plazos fijos y cuentas corrientes</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-emerald-200 shadow-sm px-4 py-3 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600">PF activos</p>
            <p className="text-2xl font-black tabular-nums text-emerald-700">{pfcc.pfActivos}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Capital equiv. ARS</p>
            <p className="text-lg font-black tabular-nums text-slate-700">{fmtN(pfcc.pfCapitalTotalARS)}</p>
            <p className="text-[10px] font-mono text-slate-400 mt-0.5">
              {fmtN(pfcc.pfCapitalARS)} ARS · {fmtN(pfcc.pfCapitalUSD)} USD
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Tasa promedio</p>
            <p className="text-2xl font-black tabular-nums text-slate-700">
              {pfcc.pfTasaPromedio != null ? `${fmtN(pfcc.pfTasaPromedio)}%` : "—"}
            </p>
          </div>
          <div className={`bg-white rounded-xl border shadow-sm px-4 py-3 flex flex-col gap-1 ${pfcc.pfVencidosCount > 0 ? "border-red-200" : "border-slate-200"}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${pfcc.pfVencidosCount > 0 ? "text-red-500" : "text-slate-400"}`}>PF vencidos</p>
            <p className={`text-2xl font-black tabular-nums ${pfcc.pfVencidosCount > 0 ? "text-red-600" : "text-slate-400"}`}>{pfcc.pfVencidosCount}</p>
          </div>
        </div>

        {pfcc.pfProximos.length > 0 && (
          <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
            <div className="bg-amber-50 border-b border-amber-100 px-4 py-2.5 flex items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                Vencen en 30 días ({pfcc.pfProximos.length})
              </p>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["Cliente", "Capital", "Mon.", "Tasa", "Vencimiento"].map((h, i) => (
                    <th key={h} className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 ${i === 0 ? "text-left" : "text-right"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pfcc.pfProximos.map((pf, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-amber-50/40">
                    <td className="px-4 py-2.5 font-medium text-slate-700">{pf.cliente}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-bold text-slate-800">{fmtN(pf.capital)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500">{pf.moneda}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                      {pf.tasaAnual != null ? `${fmtN(pf.tasaAnual)}%` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-600">
                      {pf.fechaVencimiento ? fmtDate(new Date(pf.fechaVencimiento)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pfcc.pfVencidosData.length > 0 && (
          <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
            <div className="bg-red-50 border-b border-red-100 px-4 py-2.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-600">
                PF vencidos recientes ({pfcc.pfVencidosData.length})
              </p>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["Cliente", "Capital", "Mon."].map((h, i) => (
                    <th key={h} className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 ${i === 0 ? "text-left" : "text-right"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pfcc.pfVencidosData.map((pf, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-slate-700">{pf.cliente}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-bold text-red-600">{fmtN(pf.capital)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500">{pf.moneda}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">CCs totales</p>
            <p className="text-2xl font-black tabular-nums text-slate-700">{pfcc.ccCount}</p>
          </div>
          <div className={`bg-white rounded-xl border shadow-sm px-4 py-3 flex flex-col gap-1 ${pfcc.ccSaldoTotal >= 0 ? "border-emerald-200" : "border-red-200"}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${pfcc.ccSaldoTotal >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              Saldo neto CCs
            </p>
            <p className={`text-2xl font-black tabular-nums ${pfcc.ccSaldoTotal >= 0 ? "text-emerald-700" : "text-red-600"}`}>
              {fmtN(pfcc.ccSaldoTotal)}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
