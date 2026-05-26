import type { ReactNode } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole, EstadoComision } from "@prisma/client";
import { getResumenComisiones, type ProductorMesData } from "@/lib/data/comisiones";
import { getMesOperativo } from "@/lib/services/config.service";
import { prisma } from "@/lib/prisma";
import { marcarEstadoComision } from "./actions";
import { CrearProductorForm } from "@/components/modules/comisiones/CrearProductorForm";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, dec = 2) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtFecha(d: Date) {
  return new Date(d).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "UTC",
  });
}

const ESTADO_STYLE: Record<EstadoComision, string> = {
  PENDIENTE: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  REVISADO:  "bg-blue-500/10  text-blue-400  border-blue-500/30",
  PAGADO:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
};

const ESTADO_LABEL: Record<EstadoComision, string> = {
  PENDIENTE: "Pendiente",
  REVISADO:  "Revisado",
  PAGADO:    "Pagado",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-byg-muted">{children}</h2>
  );
}

function EstadoBadge({ estado }: { estado: EstadoComision }) {
  return (
    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${ESTADO_STYLE[estado]}`}>
      {ESTADO_LABEL[estado]}
    </span>
  );
}

function EstadoActions({
  data,
  mes,
  isAdmin,
}: {
  data: ProductorMesData;
  mes: string;
  isAdmin: boolean;
}) {
  const { estado, productor } = data;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {estado === "PENDIENTE" && (
        <form action={marcarEstadoComision.bind(null, null) as (fd: FormData) => void}>
          <input type="hidden" name="productorId" value={productor.id} />
          <input type="hidden" name="mes" value={mes} />
          <input type="hidden" name="estado" value="REVISADO" />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
          >
            Marcar revisado
          </button>
        </form>
      )}
      {estado === "REVISADO" && isAdmin && (
        <form action={marcarEstadoComision.bind(null, null) as (fd: FormData) => void}>
          <input type="hidden" name="productorId" value={productor.id} />
          <input type="hidden" name="mes" value={mes} />
          <input type="hidden" name="estado" value="PAGADO" />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
          >
            Marcar pagado
          </button>
        </form>
      )}
      {estado !== "PENDIENTE" && (
        <form action={marcarEstadoComision.bind(null, null) as (fd: FormData) => void}>
          <input type="hidden" name="productorId" value={productor.id} />
          <input type="hidden" name="mes" value={mes} />
          <input type="hidden" name="estado" value="PENDIENTE" />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-byg-bg text-byg-muted border border-byg-border hover:text-byg-text transition-colors"
          >
            Reabrir
          </button>
        </form>
      )}
      <a
        href={`/print/productores/${productor.id}?mes=${mes}`}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-byg-bg text-byg-muted border border-byg-border hover:text-byg-text transition-colors"
      >
        PDF ↓
      </a>
      <a
        href={`/api/comisiones/export?mes=${mes}&productorId=${productor.id}`}
        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-byg-bg text-byg-muted border border-byg-border hover:text-byg-text transition-colors"
      >
        CSV ↓
      </a>
    </div>
  );
}

function ProductorCard({
  data,
  mes,
  isAdmin,
}: {
  data: ProductorMesData;
  mes: string;
  isAdmin: boolean;
}) {
  const { productor, estado, lineas, totalBaseUSD, totalComisionUSD } = data;
  const sinBase = lineas.filter((l) => l.sinBase).length;

  return (
    <div className="bg-byg-surface rounded-2xl border border-byg-border overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 px-5 py-4 border-b border-byg-border/50">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Productor</p>
          <p className="text-lg font-black text-byg-text">{productor.nombre}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Base comisionable</p>
          <p className="text-base font-black tabular-nums font-mono text-byg-text">USD {fmt(totalBaseUSD)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">% productor</p>
          <p className="text-base font-black tabular-nums font-mono text-byg-text">{fmt(productor.porcentaje, 1)}%</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">A pagar</p>
          <p className={`text-base font-black tabular-nums font-mono ${totalComisionUSD > 0 ? "text-amber-400" : "text-byg-muted"}`}>
            USD {fmt(totalComisionUSD)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <EstadoBadge estado={estado} />
          <EstadoActions data={data} mes={mes} isAdmin={isAdmin} />
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 px-5 py-2 bg-byg-bg text-[10px] font-medium text-byg-muted border-b border-byg-border/30">
        <span>{lineas.length} operaciones</span>
        {sinBase > 0 && <span className="text-amber-500">⚠ {sinBase} sin base</span>}
        {lineas.length === 0 && <span className="italic">Sin operaciones para el mes</span>}
      </div>

      {/* Detail table */}
      {lineas.length > 0 && (
        <details className="group [&_summary::-webkit-details-marker]:hidden">
          <summary className="px-5 py-3 text-xs font-bold text-byg-muted cursor-pointer flex items-center justify-between hover:bg-byg-surface-2 transition-colors">
            Ver detalle de {lineas.length} operaciones
            <span className="text-[10px] font-black uppercase tracking-widest group-open:hidden">Expandir ▼</span>
            <span className="text-[10px] font-black uppercase tracking-widest hidden group-open:block">Ocultar ▲</span>
          </summary>
          <div className="border-t border-byg-border/40 overflow-x-auto">
            <table className="w-full text-xs min-w-[900px]">
              <thead>
                <tr className="bg-byg-bg border-b border-byg-border">
                  {["Fecha", "Cliente", "Operación", "Módulo", "Com. Fija ARS", "Com. USD", "Base USD", "%", "Com. Prod. USD"].map((h, i) => (
                    <th
                      key={i}
                      className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-byg-muted ${i === 0 || i === 1 || i === 2 || i === 3 ? "text-left" : "text-right"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lineas.map((l) => (
                  <tr key={l.id} className="border-b border-byg-border/40 last:border-0 bg-byg-surface hover:bg-byg-surface-2 transition-colors">
                    <td className="px-4 py-2.5 text-byg-muted whitespace-nowrap">{fmtFecha(l.fecha)}</td>
                    <td className="px-4 py-2.5 text-byg-text font-medium max-w-[160px] truncate">{l.clienteNombre}</td>
                    <td className="px-4 py-2.5 text-byg-muted max-w-[200px] truncate">{l.descripcion}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${l.modulo === "bolsa" ? "bg-byg-accent/10 text-byg-accent" : "bg-purple-500/10 text-purple-400"}`}>
                        {l.modulo}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-mono text-byg-muted">
                      {l.comisionFijaARS > 0 ? `$ ${fmt(l.comisionFijaARS)}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-mono text-byg-muted">
                      {l.comisionUSD > 0 ? `${fmt(l.comisionUSD)}` : "—"}
                    </td>
                    <td className={`px-4 py-2.5 text-right tabular-nums font-mono font-bold ${l.sinBase ? "text-amber-500" : "text-byg-text"}`}>
                      {l.sinBase ? "⚠ sin base" : `${fmt(l.baseTotalUSD)}`}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-mono text-byg-muted">
                      {fmt(productor.porcentaje, 1)}%
                    </td>
                    <td className={`px-4 py-2.5 text-right tabular-nums font-mono font-bold ${l.sinBase ? "text-byg-muted" : "text-amber-400"}`}>
                      {l.sinBase ? "—" : `${fmt(l.comisionProductorUSD)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-byg-bg border-t border-byg-border">
                  <td colSpan={6} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-byg-muted">Total</td>
                  <td className="px-4 py-3 text-right tabular-nums font-mono font-black text-byg-text">USD {fmt(totalBaseUSD)}</td>
                  <td className="px-4 py-3 text-right font-black text-byg-muted">{fmt(productor.porcentaje, 1)}%</td>
                  <td className="px-4 py-3 text-right tabular-nums font-mono font-black text-amber-400">USD {fmt(totalComisionUSD)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ComisionesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const session = await auth();
  const role = (session?.user as { role?: UserRole })?.role;
  if (!session?.user || !["ADMIN", "SOCIO"].includes(role ?? "")) redirect("/inicio");

  const isAdmin = role === "ADMIN";

  const resolvedParams = await searchParams;
  const mes = resolvedParams.mes ?? (await getMesOperativo());

  const [data, productores] = await Promise.all([
    getResumenComisiones(mes),
    prisma.productor.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
  ]);

  const [mesY, mesM] = mes.split("-").map(Number);
  const mesLabel = new Date(mesY, mesM - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  const totalAPagar = data.reduce((s, d) => s + d.totalComisionUSD, 0);
  const totalBase = data.reduce((s, d) => s + d.totalBaseUSD, 0);

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Header */}
      <header>
        <p className="text-[10px] font-black text-byg-accent uppercase tracking-[0.3em]">Clientes</p>
        <h1 className="text-4xl font-black text-byg-text tracking-tight">Comisiones</h1>
        <p className="text-sm text-byg-muted font-medium mt-1">
          {mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1)} · {data.length} productor{data.length !== 1 ? "es" : ""}
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
        <a
          href={`/api/comisiones/export?mes=${mes}`}
          className="ml-auto px-4 py-2 rounded-lg bg-byg-surface border border-byg-border text-byg-muted text-xs font-bold hover:text-byg-text transition-colors"
        >
          Exportar todo CSV ↓
        </a>
      </form>

      {/* Summary KPIs */}
      {data.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-byg-surface rounded-2xl border border-byg-border p-5 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Base total comisionable</p>
            <p className="text-2xl font-black tabular-nums font-mono text-byg-text">USD {fmt(totalBase)}</p>
          </div>
          <div className="bg-byg-surface rounded-2xl border border-byg-border border-l-[5px] border-l-amber-400 p-5 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Total a pagar productores</p>
            <p className="text-2xl font-black tabular-nums font-mono text-amber-400">USD {fmt(totalAPagar)}</p>
          </div>
          <div className="bg-byg-surface rounded-2xl border border-byg-border p-5 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Pendientes de pago</p>
            <p className="text-2xl font-black tabular-nums font-mono text-red-400">
              {data.filter((d) => d.estado !== "PAGADO").length}
            </p>
          </div>
          <div className="bg-byg-surface rounded-2xl border border-byg-border p-5 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Pagados</p>
            <p className="text-2xl font-black tabular-nums font-mono text-emerald-400">
              {data.filter((d) => d.estado === "PAGADO").length}
            </p>
          </div>
        </div>
      )}

      {/* Producer cards */}
      {data.length === 0 ? (
        <div className="rounded-2xl border border-byg-border bg-byg-surface p-8 text-center text-sm text-byg-muted">
          <p className="font-bold">Sin productores activos</p>
          <p className="text-xs mt-1">Crear al menos un productor para ver comisiones.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <SectionTitle>Comisiones del mes</SectionTitle>
          {data.map((d) => (
            <ProductorCard key={d.productor.id} data={d} mes={mes} isAdmin={isAdmin} />
          ))}
        </div>
      )}

      {/* Admin: manage producers */}
      {isAdmin && (
        <div className="flex flex-col gap-4 pt-4 border-t border-byg-border/50">
          <SectionTitle>Gestión de productores</SectionTitle>

          {/* Existing producers */}
          {productores.length > 0 && (
            <div className="rounded-xl border border-byg-border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-byg-bg border-b border-byg-border">
                    {["Nombre", "% Comisión", "Activo", "Notas"].map((h, i) => (
                      <th key={i} className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-byg-muted ${i === 0 ? "text-left" : "text-right"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {productores.map((p) => (
                    <tr key={p.id} className="border-b border-byg-border/40 last:border-0 bg-byg-surface">
                      <td className="px-4 py-2.5 font-bold text-byg-text">{p.nombre}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-mono text-byg-muted">{Number(p.porcentaje).toFixed(2)}%</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${p.activo ? "bg-emerald-500/10 text-emerald-400" : "bg-byg-muted/10 text-byg-muted"}`}>
                          {p.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-byg-muted">{p.notas ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <CrearProductorForm />
        </div>
      )}
    </div>
  );
}
