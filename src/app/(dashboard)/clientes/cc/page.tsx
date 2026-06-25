import { requirePermission, canDoAction } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users } from "lucide-react";
import { NuevoClienteForm } from "@/components/modules/clientes/NuevoClienteForm";
import { ReactivarClienteButton } from "@/components/modules/clientes/ReactivarClienteButton";
import { ClickableRow } from "@/components/modules/clientes/ClickableRow";
import { getTCBlue, getClienteDeMap, getSocios } from "@/lib/services/config.service";

const SOCIOS = new Set(["Facu", "Fran", "Nanu"]);

const SOCIO_BADGE: Record<string, string> = {
  Facu: "bg-blue-600 text-white",
  Fran: "bg-emerald-600 text-white",
  Nanu: "bg-violet-600 text-white",
};

const SOCIO_ROW_BG: Record<string, string> = {
  Facu: "bg-blue-500/10 border-l-4 border-l-blue-500",
  Fran: "bg-emerald-500/10 border-l-4 border-l-emerald-500",
  Nanu: "bg-violet-500/10 border-l-4 border-l-violet-500",
};

function fmt(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
}

export default async function ClientesCCPage() {
  await requirePermission("cuentas_corrientes:leer");
  const [clientes, archivados, tcBlueRow, deMap, socios, canCrear, canEditar] = await Promise.all([
    prisma.cliente.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      include: {
        CuentaCorriente: true,
        PlazoFijo: { where: { estado: "ACTIVO" } },
      },
    }),
    prisma.cliente.findMany({
      where: { activo: false },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
    getTCBlue(),
    getClienteDeMap(),
    getSocios(),
    canDoAction("clientes:crear"),
    canDoAction("clientes:editar"),
  ]);

  const tcBlue  = tcBlueRow ? parseFloat(tcBlueRow.valor) : null;
  const hasTCB  = tcBlue !== null && tcBlue > 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in30Days = new Date(today);
  in30Days.setDate(today.getDate() + 30);

  const rows = clientes.map((c) => {
    const ccUSD = c.CuentaCorriente
      .filter((cc) => cc.moneda === "USD")
      .reduce((a, cc) => a + Number(cc.saldo.toString()), 0);

    const ccARS = c.CuentaCorriente
      .filter((cc) => cc.moneda === "ARS")
      .reduce((a, cc) => a + Number(cc.saldo.toString()), 0);

    const pfTotal = c.PlazoFijo
      .filter((pf) => pf.moneda === "USD")
      .reduce((a, pf) => a + Number(pf.saldoActual.toString()), 0);

    const pfCount    = c.PlazoFijo.length;
    const sumCap     = c.PlazoFijo.reduce((a, pf) => a + Number(pf.capital.toString()), 0);
    const sumCapTasa = c.PlazoFijo.reduce((a, pf) =>
      a + Number(pf.capital.toString()) * Number(pf.tasaAnual.toString()), 0);
    const tPond = sumCap > 0 ? sumCapTasa / sumCap : null;

    const totalUSD = ccUSD + pfTotal + (hasTCB ? ccARS / tcBlue! : 0);
    const de = deMap[c.nombre] ?? null;
    const isSocio = SOCIOS.has(c.nombre);

    const pfVencido = c.PlazoFijo.some((pf) => new Date(pf.fechaVencimiento) < today);
    const pfProximo = !pfVencido && c.PlazoFijo.some(
      (pf) => new Date(pf.fechaVencimiento) >= today && new Date(pf.fechaVencimiento) <= in30Days
    );

    return { id: c.id, nombre: c.nombre, ccUSD, ccARS, pfTotal, totalUSD, tPond, pfCount, de, isSocio, pfVencido, pfProximo };
  });

  const totCCUSD   = rows.reduce((a, r) => a + r.ccUSD,    0);
  const totCCARS   = rows.reduce((a, r) => a + r.ccARS,    0);
  const totPF      = rows.reduce((a, r) => a + r.pfTotal,  0);
  const totUSD     = rows.reduce((a, r) => a + r.totalUSD, 0);
  const totPFCount = rows.reduce((a, r) => a + r.pfCount,  0);

  const allPFs      = clientes.flatMap((c) => c.PlazoFijo);
  const gSumCap     = allPFs.reduce((a, pf) => a + Number(pf.capital.toString()), 0);
  const gSumCapTasa = allPFs.reduce((a, pf) =>
    a + Number(pf.capital.toString()) * Number(pf.tasaAnual.toString()), 0);
  const globalTPond = gSumCap > 0 ? gSumCapTasa / gSumCap : null;

  return (
    <div className="flex flex-col gap-8">

      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-byg-surface-2 text-byg-text rounded-2xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-byg-accent uppercase tracking-[0.3em]">Clientes</p>
            <h1 className="text-3xl font-black text-byg-text tracking-tight">Clientes CC</h1>
            <p className="text-byg-muted font-medium text-sm">Cuentas corrientes y plazos fijos</p>
          </div>
        </div>
        {canCrear && <NuevoClienteForm socios={socios.map(s => s.nombre)} />}
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-byg-surface rounded-xl border border-byg-border px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-byg-muted">Total clientes</p>
          <p className="text-2xl font-black text-byg-text tabular-nums mt-1">{rows.length}</p>
        </div>
        <div className="bg-byg-surface rounded-xl border border-byg-border px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-byg-muted">CC USD total</p>
          <p className="text-2xl font-black text-byg-text tabular-nums font-mono mt-1">{fmt(totCCUSD)}</p>
        </div>
        <div className="bg-byg-surface rounded-xl border border-byg-border px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-byg-muted">PF total</p>
          <p className="text-2xl font-black text-byg-text tabular-nums font-mono mt-1">{fmt(totPF)}</p>
        </div>
        <div className="bg-byg-surface rounded-xl border border-byg-border px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-byg-muted">
            Total USD{hasTCB ? "*" : ""}
          </p>
          <p className="text-2xl font-black text-byg-text tabular-nums font-mono mt-1">{fmt(totUSD)}</p>
          {!hasTCB && (
            <p className="text-[9px] text-amber-700 dark:text-amber-400 mt-0.5">TC Blue sin configurar — ARS excluido</p>
          )}
        </div>
      </div>

      {/* Main table */}
      <div className="bg-byg-surface rounded-xl border border-byg-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[920px]">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[12%]" />
              <col className="w-[9%]" />
              <col className="w-[7%]" />
              <col className="w-[9%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead>
              <tr className="bg-byg-bg border-b border-byg-border">
                <th className="px-4 py-3 text-[10px] font-black uppercase text-byg-muted tracking-wider">Cliente</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-byg-muted tracking-wider text-right">CC USD</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-byg-muted tracking-wider text-right">CC ARS</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-byg-muted tracking-wider text-right">PF Total</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-byg-muted tracking-wider text-right">Total USD*</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-byg-muted tracking-wider text-right">T.Pond.</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-byg-muted tracking-wider text-center">PFs</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-byg-muted tracking-wider text-center">De</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-byg-muted tracking-wider text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-byg-border/50">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-byg-muted text-sm italic">
                    Sin clientes activos
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <ClickableRow key={r.id} href={`/clientes/${r.id}`} className={`transition-colors hover:bg-byg-accent/10 ${r.isSocio ? (SOCIO_ROW_BG[r.nombre] ?? "") : r.pfVencido ? "bg-red-500/5" : r.pfProximo ? "bg-amber-500/5" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/clientes/${r.id}`}
                          className="text-sm font-semibold text-byg-text hover:text-byg-accent transition-colors"
                        >
                          {r.nombre}
                        </Link>
                        {r.isSocio && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest shrink-0 ${SOCIO_BADGE[r.nombre] ?? "bg-byg-surface-2 text-byg-muted"}`}>
                            SOCIO
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-xs text-right tabular-nums font-mono font-medium ${r.ccUSD < 0 ? "text-red-400" : "text-byg-text"}`}>
                      {fmt(r.ccUSD)}
                    </td>
                    <td className={`px-4 py-3 text-xs text-right tabular-nums font-mono font-medium ${r.ccARS < 0 ? "text-red-400" : "text-byg-muted"}`}>
                      {r.ccARS !== 0 ? fmt(r.ccARS) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-right tabular-nums font-mono font-medium text-byg-text">
                      {r.pfTotal > 0 ? fmt(r.pfTotal) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-right tabular-nums font-mono font-black text-byg-text">
                      {fmt(r.totalUSD)}
                    </td>
                    <td className="px-4 py-3 text-xs text-right tabular-nums font-mono font-semibold text-byg-accent">
                      {r.tPond !== null ? fmtPct(r.tPond) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.pfCount > 0 ? (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          r.pfVencido
                            ? "bg-red-500/15 text-red-700 dark:text-red-400"
                            : r.pfProximo
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                              : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        }`}>
                          {r.pfCount} PF{r.pfVencido ? " !" : r.pfProximo ? " ·" : ""}
                        </span>
                      ) : (
                        <span className="text-[10px] text-byg-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.de ? (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${SOCIO_BADGE[r.de] ?? "bg-byg-surface-2 text-byg-muted"}`}>
                          {r.de}
                        </span>
                      ) : (
                        <span className="text-[10px] text-byg-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/clientes/${r.id}`}
                        className="text-[10px] font-black px-3 py-1 rounded-full bg-byg-accent/10 text-byg-accent hover:bg-byg-accent/20 transition-colors uppercase tracking-widest"
                      >
                        Ver
                      </Link>
                    </td>
                  </ClickableRow>
                ))
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-byg-bg border-t border-byg-border">
                  <td className="px-4 py-3 text-[10px] font-black uppercase text-byg-muted tracking-wider">
                    TOTAL ({rows.length})
                  </td>
                  <td className="px-4 py-3 text-xs text-right tabular-nums font-mono font-black text-byg-text">
                    {fmt(totCCUSD)}
                  </td>
                  <td className="px-4 py-3 text-xs text-right tabular-nums font-mono font-black text-byg-muted">
                    {totCCARS !== 0 ? fmt(totCCARS) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-right tabular-nums font-mono font-black text-byg-text">
                    {fmt(totPF)}
                  </td>
                  <td className="px-4 py-3 text-xs text-right tabular-nums font-mono font-black text-byg-accent">
                    {fmt(totUSD)}
                  </td>
                  <td className="px-4 py-3 text-xs text-right tabular-nums font-mono font-semibold text-byg-accent">
                    {globalTPond !== null ? fmtPct(globalTPond) : "—"}
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-black text-byg-text">{totPFCount}</td>
                  <td />
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <p className="text-[10px] text-byg-muted text-right">
        {hasTCB
          ? `* Total USD = CC USD + PF saldoActual + CC ARS ÷ TC Blue ${fmt(tcBlue!)} · ${rows.length} registros`
          : `* TC Blue no configurado — CC ARS excluido de Total USD · Configurar en /configuracion · ${rows.length} registros`}
      </p>

      {/* Archived clients */}
      {archivados.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">
            Clientes archivados ({archivados.length})
          </p>
          <div className="bg-byg-surface rounded-xl border border-byg-border overflow-hidden">
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-byg-border/50">
                {archivados.map((c) => (
                  <tr key={c.id} className="hover:bg-byg-surface-2 transition-colors">
                    <td className="px-5 py-3 text-sm font-semibold text-byg-muted">{c.nombre}</td>
                    <td className="px-5 py-3">
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-byg-surface-2 text-byg-muted uppercase tracking-widest">
                        Archivado
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/clientes/${c.id}`}
                          className="text-[10px] font-black px-3 py-1 rounded-full bg-byg-surface-2 text-byg-muted hover:bg-byg-border transition-colors uppercase tracking-widest border border-byg-border"
                        >
                          Ver historial
                        </Link>
                        {canEditar && <ReactivarClienteButton clienteId={c.id} />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
