import { prisma } from "@/lib/prisma";
import Link from "next/link";

function fmt(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function diffDays(from: Date, to: Date) {
  return Math.ceil((to.getTime() - from.getTime()) / 86_400_000);
}

export default async function PendientesPage() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const en7 = new Date(hoy.getTime() + 7 * 86_400_000);

  const [ccNegativas, pfVencidos, pfProximos, pendientesLiquidar] = await Promise.all([
    prisma.cuentaCorriente.findMany({
      where: { saldo: { lt: 0 } },
      orderBy: { saldo: "asc" },
      include: { Cliente: { select: { id: true, nombre: true } } },
    }),
    prisma.plazoFijo.findMany({
      where: { estado: "ACTIVO", fechaVencimiento: { lt: hoy } },
      orderBy: { fechaVencimiento: "asc" },
      include: { Cliente: { select: { id: true, nombre: true } } },
    }),
    prisma.plazoFijo.findMany({
      where: { estado: "ACTIVO", fechaVencimiento: { gte: hoy, lte: en7 } },
      orderBy: { fechaVencimiento: "asc" },
      include: { Cliente: { select: { id: true, nombre: true } } },
    }),
    prisma.movimientoCaja.findMany({
      where: { confirmado: false },
      orderBy: [{ moneda: "asc" }, { tipo: "asc" }, { descripcion: "asc" }],
    }),
  ]);

  const pendUSD = pendientesLiquidar.filter((p) => p.moneda === "USD");
  const pendARS = pendientesLiquidar.filter((p) => p.moneda === "ARS");

  function netPendientes(rows: typeof pendientesLiquidar) {
    return rows.reduce((acc, r) => {
      const m = Number(r.monto);
      return acc + (r.tipo === "ENTRADA" || r.tipo === "TRANSFERENCIA_IN" ? m : -m);
    }, 0);
  }

  const clientesAtencion = new Set([
    ...ccNegativas.map((c) => c.clienteId),
    ...pfVencidos.map((p) => p.clienteId),
  ]).size;

  const ActionLink = ({ href }: { href: string }) => (
    <Link
      href={href}
      className="text-[10px] font-black px-3 py-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors uppercase tracking-widest"
    >
      Ver →
    </Link>
  );

  const netUSD = netPendientes(pendUSD);
  const netARS = netPendientes(pendARS);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Operativa</p>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Pendientes</h1>
        <p className="text-sm text-slate-400 font-medium mt-1">Acciones operativas que requieren atención</p>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "A liquidar",         value: pendientesLiquidar.length, color: "border-t-violet-500", text: pendientesLiquidar.length > 0 ? "text-violet-700" : "text-slate-900" },
          { label: "CC negativas",       value: ccNegativas.length,        color: "border-t-red-500",    text: ccNegativas.length > 0 ? "text-red-600" : "text-slate-900" },
          { label: "PF vencidos",        value: pfVencidos.length,         color: "border-t-red-400",    text: pfVencidos.length > 0 ? "text-red-600" : "text-slate-900" },
          { label: "PF próximos ≤7d",    value: pfProximos.length,         color: "border-t-amber-400",  text: pfProximos.length > 0 ? "text-amber-600" : "text-slate-900" },
        ].map(({ label, value, color, text }) => (
          <div key={label} className={`bg-white rounded-xl border border-slate-200 border-t-[3px] ${color} shadow-sm p-5 flex flex-col gap-1`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className={`text-3xl font-black tabular-nums ${text}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Pendientes a liquidar */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pendientes a liquidar</h2>
          {pendientesLiquidar.length > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 uppercase tracking-widest">
              {pendientesLiquidar.length}
            </span>
          )}
        </div>

        {pendientesLiquidar.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-8 text-center text-slate-400 italic text-xs">
            Sin operaciones pendientes
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* USD */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-600">USD — {pendUSD.length} ítem</p>
                <p className={`text-[12px] font-black tabular-nums ${netUSD >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  Neto: {netUSD >= 0 ? "+" : ""}{fmt(netUSD)}
                </p>
              </div>
              <table className="w-full text-xs">
                <tbody>
                  {pendUSD.length === 0 ? (
                    <tr><td className="px-5 py-4 text-slate-400 italic">Sin pendientes USD</td></tr>
                  ) : pendUSD.map((p) => {
                    const esEntrada = p.tipo === "ENTRADA" || p.tipo === "TRANSFERENCIA_IN";
                    const label = p.descripcion?.split(" - ")[0] ?? p.descripcion ?? "";
                    return (
                      <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-violet-50/30">
                        <td className="px-5 py-2.5 font-medium text-slate-700 max-w-[240px] truncate">{label}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${esEntrada ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                            {esEntrada ? "↑ cobrar" : "↓ pagar"}
                          </span>
                        </td>
                        <td className={`px-5 py-2.5 text-right tabular-nums font-black ${esEntrada ? "text-emerald-600" : "text-red-600"}`}>
                          {esEntrada ? "+" : "-"}{fmt(Number(p.monto))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ARS */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-600">ARS — {pendARS.length} ítem</p>
                <p className={`text-[12px] font-black tabular-nums ${netARS >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  Neto: {netARS >= 0 ? "+" : ""}{fmt(netARS)}
                </p>
              </div>
              <table className="w-full text-xs">
                <tbody>
                  {pendARS.length === 0 ? (
                    <tr><td className="px-5 py-4 text-slate-400 italic">Sin pendientes ARS</td></tr>
                  ) : pendARS.map((p) => {
                    const esEntrada = p.tipo === "ENTRADA" || p.tipo === "TRANSFERENCIA_IN";
                    const label = p.descripcion?.split(" - ")[0] ?? p.descripcion ?? "";
                    return (
                      <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-violet-50/30">
                        <td className="px-5 py-2.5 font-medium text-slate-700 max-w-[240px] truncate">{label}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${esEntrada ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                            {esEntrada ? "↑ cobrar" : "↓ pagar"}
                          </span>
                        </td>
                        <td className={`px-5 py-2.5 text-right tabular-nums font-black ${esEntrada ? "text-emerald-600" : "text-red-600"}`}>
                          {esEntrada ? "+" : "-"}{fmt(Number(p.monto))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* CC negativas */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cuentas negativas</h2>
          {ccNegativas.length > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600 uppercase tracking-widest">
              {ccNegativas.length}
            </span>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Cliente", "Cuenta", "Saldo", "Acción"].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ${i === 2 ? "text-right" : i === 3 ? "text-center" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ccNegativas.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">Sin cuentas negativas</td></tr>
              ) : ccNegativas.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-red-50/40">
                  <td className="px-4 py-3 font-bold text-slate-800">{c.Cliente.nombre}</td>
                  <td className="px-4 py-3 text-slate-500">{c.moneda}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-black text-red-600">{fmt(Number(c.saldo))}</td>
                  <td className="px-4 py-3 text-center"><ActionLink href={`/clientes/${c.Cliente.id}`} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* PF vencidos */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">PF vencidos</h2>
          {pfVencidos.length > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600 uppercase tracking-widest">
              {pfVencidos.length}
            </span>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Cliente", "Capital", "Vencimiento", "Días vencido", "Acción"].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ${i === 1 || i === 3 ? "text-right" : i === 4 ? "text-center" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pfVencidos.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">Sin PF vencidos</td></tr>
              ) : pfVencidos.map((p) => {
                const dias = diffDays(p.fechaVencimiento, hoy);
                return (
                  <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-red-50/40">
                    <td className="px-4 py-3 font-bold text-slate-800">{p.Cliente.nombre}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-700">{p.moneda} {fmt(Number(p.capital))}</td>
                    <td className="px-4 py-3 text-slate-500">{fmtDate(p.fechaVencimiento)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-black text-red-600">{dias}d</td>
                    <td className="px-4 py-3 text-center"><ActionLink href={`/clientes/${p.Cliente.id}`} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* PF próximos */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">PF próximos a vencer</h2>
          {pfProximos.length > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-widest">
              {pfProximos.length}
            </span>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Cliente", "Capital", "Vencimiento", "Días restantes", "Acción"].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ${i === 1 || i === 3 ? "text-right" : i === 4 ? "text-center" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pfProximos.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">Sin vencimientos en 7 días</td></tr>
              ) : pfProximos.map((p) => {
                const dias = diffDays(hoy, p.fechaVencimiento);
                return (
                  <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-amber-50/40">
                    <td className="px-4 py-3 font-bold text-slate-800">{p.Cliente.nombre}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-700">{p.moneda} {fmt(Number(p.capital))}</td>
                    <td className="px-4 py-3 text-slate-500">{fmtDate(p.fechaVencimiento)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-black text-amber-600">{dias}d</td>
                    <td className="px-4 py-3 text-center"><ActionLink href={`/clientes/${p.Cliente.id}`} /></td>
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
