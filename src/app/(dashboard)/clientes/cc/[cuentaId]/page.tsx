import { requirePermission } from "@/lib/auth/permissions";
import { getMovimientosCuentaCorriente } from "@/lib/data/movimiento-cc";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Landmark } from "lucide-react";
import { MovimientoButton } from "@/components/modules/clientes/MovimientoButton";
import { AplicarInteresPanel } from "@/components/modules/clientes/AplicarInteresPanel";

type PageProps = { params: Promise<{ cuentaId: string }> };

function toNum(v: { toString(): string } | null | undefined): number {
  if (v == null) return 0;
  const n = Number(v.toString());
  return isNaN(n) ? 0 : n;
}

function fmt(v: number) {
  return v.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtFecha(d: Date | string | null | undefined) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("es-AR", {
      day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC",
    });
  } catch { return "—"; }
}

function cleanDesc(d: string | null | undefined): string {
  if (!d) return "—";
  return d.replace(/\s*\|\s*op:[a-zA-Z0-9-]+/, "").replace(/\s*\|\s*ref:[a-zA-Z0-9-]+/, "").trim() || "—";
}

const TIPO_BADGE: Record<string, string> = {
  INGRESO:       "bg-emerald-500/10 text-emerald-400",
  EGRESO:        "bg-rose-500/10 text-rose-400",
  INTERES:       "bg-byg-accent/10 text-byg-accent",
  TRANSFERENCIA: "bg-violet-500/10 text-violet-400",
  AJUSTE:        "bg-amber-500/10 text-amber-400",
};

const DEBE_TIPOS = new Set(["EGRESO"]);
const HABER_TIPOS = new Set(["INGRESO", "INTERES", "TRANSFERENCIA", "AJUSTE"]);

export default async function CCDetailPage({ params }: PageProps) {
  await requirePermission("cuentas_corrientes:leer");
  const { cuentaId } = await params;
  const cuenta = await getMovimientosCuentaCorriente(cuentaId);
  if (!cuenta) notFound();

  const clienteId = cuenta.clienteId;
  const movimientos = cuenta.MovimientoCC;
  const saldoActual = toNum(cuenta.saldo);
  const tasaCC = toNum(cuenta.Cliente.tasaCC);
  const vigenteDesde = cuenta.Cliente.updatedAt.toISOString().slice(0, 10);

  // Compute running balance per row (movements are newest-first)
  let running = saldoActual;
  const rows = movimientos.map((m) => {
    const monto = toNum(m.monto);
    const saldoRow = running;
    if (HABER_TIPOS.has(m.tipo)) {
      running -= monto;
    } else if (DEBE_TIPOS.has(m.tipo)) {
      running += monto;
    }
    return { ...m, saldoRow };
  });

  // Dates computed server-side to avoid hydration mismatch
  const hoy = new Date();
  const fechaFin = hoy.toISOString().slice(0, 10);
  const fechaInicio = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);

  return (
    <div className="flex flex-col gap-8">

      {/* Breadcrumb */}
      <Link
        href={`/clientes/${clienteId}`}
        className="flex items-center gap-1 text-byg-muted hover:text-byg-accent text-[10px] font-black uppercase tracking-widest transition-colors group w-fit"
      >
        <ChevronLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
        {cuenta.Cliente.nombre}
      </Link>

      {/* Header */}
      <header className="flex items-center justify-between gap-5 bg-byg-surface px-6 py-5 rounded-2xl border border-byg-border relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-byg-accent" />
        <div className="flex items-center gap-4 min-w-0">
          <div className="p-3 bg-byg-bg text-byg-accent rounded-xl border border-byg-border shrink-0">
            <Landmark size={24} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black text-byg-accent uppercase tracking-widest">Cuenta Corriente</span>
              <span className="text-[10px] font-black bg-byg-surface-2 text-byg-muted px-1.5 py-0.5 rounded uppercase tracking-wider border border-byg-border">
                {cuenta.moneda}
              </span>
            </div>
            <h1 className="text-2xl font-black text-byg-text tracking-tight truncate">
              {cuenta.Cliente.nombre}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-6 shrink-0">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted mb-0.5">Saldo actual</p>
            <p className={`text-4xl font-black tabular-nums tracking-tighter font-mono ${saldoActual < 0 ? "text-rose-400" : "text-byg-text"}`}>
              {fmt(saldoActual)}
            </p>
          </div>
          <MovimientoButton cuentaId={cuenta.id} clienteId={clienteId} />
        </div>
      </header>

      {/* Ledger table */}
      <section className="bg-byg-surface rounded-2xl border border-byg-border overflow-hidden">
        <div className="px-6 py-4 border-b border-byg-border">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-byg-text">Extracto de cuenta</h2>
        </div>
        {rows.length === 0 ? (
          <p className="px-6 py-4 text-[12px] text-byg-muted italic">Sin movimientos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px] table-fixed">
              <colgroup>
                <col className="w-[100px]" />
                <col />
                <col className="w-[120px]" />
                <col className="w-[120px]" />
                <col className="w-[140px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-byg-border bg-byg-bg">
                  <th className="px-6 py-3 text-[10px] font-black uppercase text-byg-muted tracking-[0.2em]">Fecha</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase text-byg-muted tracking-[0.2em]">Descripción</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase text-byg-muted tracking-[0.2em] text-right">Debe</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase text-byg-muted tracking-[0.2em] text-right">Haber</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase text-byg-muted tracking-[0.2em] text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-byg-border/40">
                {rows.map((m) => {
                  const monto = toNum(m.monto);
                  const isDebe = DEBE_TIPOS.has(m.tipo);
                  const tipoColor = TIPO_BADGE[m.tipo]?.split(" ").find(c => c.startsWith("text-")) ?? "text-byg-muted";
                  return (
                    <tr key={m.id} className="hover:bg-byg-surface-2 transition-colors group">
                      <td className="px-6 py-3.5 text-[12px] font-medium text-byg-muted whitespace-nowrap font-mono">{fmtFecha(m.fecha)}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[13px] font-bold text-byg-text">{cleanDesc(m.descripcion)}</span>
                          <span className={`text-[9px] font-black uppercase tracking-widest w-fit ${tipoColor}`}>
                            {m.tipo}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-[14px] font-black text-right tabular-nums font-mono text-rose-400">
                        {isDebe ? fmt(monto) : ""}
                      </td>
                      <td className="px-6 py-3.5 text-[14px] font-black text-right tabular-nums font-mono text-emerald-400">
                        {!isDebe ? fmt(monto) : ""}
                      </td>
                      <td className={`px-6 py-3.5 text-[14px] font-black text-right tabular-nums font-mono tracking-tight ${m.saldoRow < 0 ? "text-rose-400 bg-rose-500/5" : "text-byg-text"}`}>
                        {fmt(m.saldoRow)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="px-6 py-3 text-[10px] text-byg-muted border-t border-byg-border">{movimientos.length} movimientos</p>
      </section>

      {/* Apply interest panel */}
      <AplicarInteresPanel
        cuentaId={cuenta.id}
        clienteId={clienteId}
        tasaCC={tasaCC}
        vigenteDesde={vigenteDesde}
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
      />

    </div>
  );
}
