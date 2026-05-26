import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { getUtilidadMes } from "@/lib/data/reportes-ejecutivo";
import { getResumenComisiones, type ProductorMesData } from "@/lib/data/comisiones";
import { getMesOperativo } from "@/lib/services/config.service";
import { prisma } from "@/lib/prisma";
import type { SnapshotData } from "@/lib/data/cierres";
import Link from "next/link";

function fmt(n: number, dec = 2) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function KPI({
  label,
  value,
  sub,
  color = "text-byg-text",
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  accent?: boolean;
}) {
  return (
    <div className={`bg-byg-surface rounded-2xl border p-5 flex flex-col gap-1 ${accent ? "border-l-[5px] border-l-byg-accent border-byg-border" : "border-byg-border"}`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">{label}</p>
      <p className={`text-2xl font-black tabular-nums font-mono ${color}`}>{value}</p>
      {sub && <p className="text-xs text-byg-muted">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-byg-muted">{children}</h2>;
}

function LineTable({ items, title }: { items: { label: string; montoARS: number }[]; title: string }) {
  if (items.length === 0) return null;
  const total = items.reduce((s, it) => s + it.montoARS, 0);
  return (
    <div className="rounded-xl border border-byg-border overflow-hidden">
      <div className="bg-byg-bg px-4 py-2 text-[10px] font-black uppercase tracking-widest text-byg-muted border-b border-byg-border">
        {title}
      </div>
      <table className="w-full text-xs">
        <tbody>
          {items.map((it, i) => (
            <tr key={i} className="border-b border-byg-border/40 last:border-0">
              <td className="px-4 py-2 text-byg-text">{it.label}</td>
              <td className="px-4 py-2 text-right tabular-nums font-mono font-bold text-byg-text">
                $ {fmt(it.montoARS)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-byg-bg border-t border-byg-border">
            <td className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-byg-muted">Total</td>
            <td className="px-4 py-2 text-right tabular-nums font-mono font-black text-byg-text">$ {fmt(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default async function ReporteMensualPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const session = await auth();
  const role = (session?.user as { role?: UserRole })?.role;
  if (!session?.user || !["ADMIN", "SOCIO"].includes(role ?? "")) redirect("/inicio");

  const resolvedParams = await searchParams;
  const mes = resolvedParams.mes ?? (await getMesOperativo());

  // Check if month is frozen
  const cierre = await prisma.cierreMensual.findUnique({ where: { mes } }).catch(() => null);
  const isClosed = cierre?.estado === "CERRADO" && cierre?.snapshotData != null;

  let utilidad: Awaited<ReturnType<typeof getUtilidadMes>>;
  let comisiones: Pick<ProductorMesData, "productor" | "estado" | "totalBaseUSD" | "totalComisionUSD"> & { lineas: { length: number }[] }[] | ProductorMesData[];

  if (isClosed) {
    const snap = cierre!.snapshotData as unknown as SnapshotData;
    utilidad = snap.utilidad;
    comisiones = snap.comisiones.map((c) => ({
      productor:        { id: c.productor.id, nombre: c.productor.nombre, porcentaje: c.productor.porcentaje },
      comisionMesId:    c.comisionMesId,
      estado:           c.estado as ProductorMesData["estado"],
      lineas:           Array(c.lineasCount) as ProductorMesData["lineas"],
      totalBaseUSD:     c.totalBaseUSD,
      totalComisionUSD: c.totalComisionUSD,
    }));
  } else {
    [utilidad, comisiones] = await Promise.all([
      getUtilidadMes(mes),
      getResumenComisiones(mes),
    ]);
  }

  const [mesY, mesM] = mes.split("-").map(Number);
  const mesLabel = new Date(mesY, mesM - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  const tc = utilidad.tcBlue;
  const arbUSDEquiv = utilidad.arbitrajesUSD + utilidad.arbitrajesARS / tc;
  const honorariosUSD = utilidad.ingresosARS / tc;
  const egresosUSD    = utilidad.egresosARS / tc;
  const comisionesPagar = comisiones.reduce((s, d) => s + d.totalComisionUSD, 0);
  const utilidadNeta = utilidad.utilidadTotalUSD - comisionesPagar;

  return (
    <div className="flex flex-col gap-8 pb-20">
      <header>
        <p className="text-[10px] font-black text-byg-accent uppercase tracking-[0.3em]">Reportes</p>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-4xl font-black text-byg-text tracking-tight">Reporte Mensual</h1>
          {isClosed && (
            <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 tracking-wider">
              SNAPSHOT CONGELADO
            </span>
          )}
        </div>
        <p className="text-sm text-byg-muted font-medium mt-1">
          {mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1)} · TC Blue ${fmt(tc, 0)}
          {isClosed && cierre?.fechaCierre && (
            <> · Cerrado el {new Date(cierre.fechaCierre).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}</>
          )}
        </p>
      </header>

      {/* Month selector */}
      <form method="GET" className="flex items-center gap-3">
        <label className="text-xs font-bold text-byg-muted uppercase tracking-widest">Mes</label>
        <input
          type="month"
          name="mes"
          defaultValue={mes}
          className="px-3 py-2 rounded-lg bg-byg-surface border border-byg-border text-byg-text text-sm font-medium focus:outline-none focus:ring-2 focus:ring-byg-accent/40"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-byg-surface border border-byg-border text-byg-text text-xs font-bold hover:bg-byg-surface-2 transition-colors"
        >
          Ver
        </button>
        <Link
          href={`/comisiones?mes=${mes}`}
          className="ml-auto text-xs font-bold text-byg-muted hover:text-byg-text transition-colors"
        >
          Ver detalle comisiones →
        </Link>
      </form>

      {/* Result KPIs */}
      <div className="flex flex-col gap-3">
        <SectionTitle>Resultado del mes</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI
            label="Resultado Cambio FX"
            value={`USD ${fmt(utilidad.cambioUSD)}`}
            color={utilidad.cambioUSD >= 0 ? "text-emerald-400" : "text-red-400"}
          />
          <KPI
            label="Arbitrajes (equiv. USD)"
            value={`USD ${fmt(arbUSDEquiv)}`}
            color={arbUSDEquiv >= 0 ? "text-emerald-400" : "text-red-400"}
          />
          <KPI
            label="Honorarios / ingresos"
            value={`USD ${fmt(honorariosUSD)}`}
            sub={`$ ${fmt(utilidad.ingresosARS)}`}
            color="text-byg-text"
          />
          <KPI
            label="Egresos operativos"
            value={`USD ${fmt(egresosUSD)}`}
            sub={`$ ${fmt(utilidad.egresosARS)}`}
            color={egresosUSD > 0 ? "text-red-400" : "text-byg-muted"}
          />
        </div>
      </div>

      {/* Commissions & Net */}
      <div className="flex flex-col gap-3">
        <SectionTitle>Comisiones y resultado neto estimado</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <KPI
            label="Utilidad bruta estimada"
            value={`USD ${fmt(utilidad.utilidadTotalUSD)}`}
            color={utilidad.utilidadTotalUSD >= 0 ? "text-byg-text" : "text-red-400"}
          />
          <KPI
            label="Comisiones a productores"
            value={`USD ${fmt(comisionesPagar)}`}
            sub={`${comisiones.length} productor(es)`}
            color="text-amber-400"
          />
          <KPI
            label="Utilidad neta estimada"
            value={`USD ${fmt(utilidadNeta)}`}
            color={utilidadNeta >= 0 ? "text-emerald-400" : "text-red-400"}
            accent
          />
        </div>
      </div>

      {/* Breakdown tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-3">
          <SectionTitle>Ingresos operativos — detalle</SectionTitle>
          <LineTable items={utilidad.ingresosItems} title={`Ingresos — $ ${fmt(utilidad.ingresosARS)}`} />
          {utilidad.ingresosItems.length === 0 && (
            <p className="text-xs text-byg-muted italic">Sin ingresos registrados</p>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <SectionTitle>Egresos operativos — detalle</SectionTitle>
          <LineTable items={utilidad.egresosItems} title={`Egresos — $ ${fmt(utilidad.egresosARS)}`} />
          {utilidad.egresosItems.length === 0 && (
            <p className="text-xs text-byg-muted italic">Sin egresos registrados</p>
          )}
        </div>
      </div>

      {/* Producer commissions breakdown */}
      {comisiones.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionTitle>Comisiones a pagar por productor</SectionTitle>
          <div className="rounded-xl border border-byg-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-byg-bg border-b border-byg-border">
                  {["Productor", "Operaciones", "Base comisionable", "%", "A pagar", "Estado"].map((h, i) => (
                    <th key={i} className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-byg-muted ${i <= 1 ? "text-left" : "text-right"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comisiones.map((d) => (
                  <tr key={d.productor.id} className="border-b border-byg-border/40 last:border-0 bg-byg-surface hover:bg-byg-surface-2 transition-colors">
                    <td className="px-4 py-2.5 font-bold text-byg-text">{d.productor.nombre}</td>
                    <td className="px-4 py-2.5 text-byg-muted">{d.lineas.length}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-mono text-byg-text">USD {fmt(d.totalBaseUSD)}</td>
                    <td className="px-4 py-2.5 text-right text-byg-muted">{Number(d.productor.porcentaje).toFixed(1)}%</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-mono font-bold text-amber-400">USD {fmt(d.totalComisionUSD)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                        d.estado === "PAGADO"   ? "bg-emerald-500/10 text-emerald-400" :
                        d.estado === "REVISADO" ? "bg-blue-500/10 text-blue-400" :
                        "bg-amber-500/10 text-amber-400"
                      }`}>
                        {d.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-byg-bg border-t border-byg-border">
                  <td colSpan={4} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-byg-muted">Total a pagar</td>
                  <td className="px-4 py-3 text-right tabular-nums font-mono font-black text-amber-400">USD {fmt(comisionesPagar)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-byg-muted italic border-t border-byg-border/50 pt-4">
        Los valores son estimados basados en operaciones registradas. El resultado real puede diferir por operaciones pendientes, ajustes manuales o movimientos no contabilizados.
        TC Blue utilizado: ${fmt(tc, 0)}.
      </p>
    </div>
  );
}
