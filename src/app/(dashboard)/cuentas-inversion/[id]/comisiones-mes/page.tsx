import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getMesOperativo } from "@/lib/services/config.service";
import { ConfigComisionesBolsaForm } from "./ConfigForm";

type PageProps = {
  params:       Promise<{ id: string }>;
  searchParams: Promise<{ mes?: string }>;
};

function fmt(n: number, dec = 2) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtDate(v: Date | null) {
  if (!v) return "—";
  return v.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
}

type OpRow = {
  id:            string;
  fechaOperativa: Date | null;
  tipoOperacion:  string;
  ticker:         string;
  cantidad:       number;
  precio:         number;
  moneda:         string;
  comisionPct:    number | null;
  comisionFija:   number | null;
  esSenebi:       boolean;
  senebiBruto:    number | null;
  sujeto:         string;
  productor:      string;   // "IPS" | "BYG" | "OTRO"
};

function comisionGenerada(op: OpRow): number {
  if (op.esSenebi) return op.senebiBruto ?? 0;
  const valorBruto = op.cantidad * op.precio;
  return (op.comisionFija ?? 0) + valorBruto * ((op.comisionPct ?? 0) / 100);
}

const PRODUCTOR_LABEL: Record<string, string> = { IPS: "IPS", BYG: "BYG", OTRO: "Otro" };
const TIPO_LABEL: Record<string, string> = {
  COMPRA_BONO:        "Compra Bono",
  VENTA_BONO:         "Venta Bono",
  COMPRA_ACCION:      "Compra Acción",
  VENTA_ACCION:       "Venta Acción",
  COMPRA_CEDEAR:      "Compra CEDEAR",
  VENTA_CEDEAR:       "Venta CEDEAR",
  CAUCION_COLOCADORA: "Caución Coloc.",
  CAUCION_TOMADORA:   "Caución Tomad.",
  FUTURO:             "Futuro",
  OPCION_CALL:        "Opción Call",
  OPCION_PUT:         "Opción Put",
  MEP:                "MEP",
  SENEBI:             "SENEBI",
};

function StatCard({
  label, value, sub, accent,
}: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-1 ${accent ? "border-byg-accent/30 bg-byg-accent/5" : "border-byg-border bg-byg-surface"}`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">{label}</p>
      <p className={`text-xl font-black tabular-nums font-mono ${accent ? "text-byg-accent" : "text-byg-text"}`}>{value}</p>
      {sub && <p className="text-[10px] text-byg-muted font-mono">{sub}</p>}
    </div>
  );
}

export default async function ComisionesMesPage({ params, searchParams }: PageProps) {
  const { id }       = await params;
  const { mes: mesParam } = await searchParams;

  // Resolve month: default to active operational month
  const now = new Date();
  const mesCalendario = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const mesOperativo  = await getMesOperativo();
  const mes           = mesParam ?? mesOperativo;

  const [year, month] = mes.split("-").map(Number);
  const mesStart = new Date(Date.UTC(year, month - 1, 1));
  const mesEnd   = new Date(Date.UTC(year, month, 1));

  const mesLabel = mesStart.toLocaleDateString("es-AR", {
    month: "long", year: "numeric", timeZone: "UTC",
  });

  // Fetch cuenta and its comitentes
  const cuenta = await prisma.cuentaInversion.findUnique({
    where: { id },
    include: {
      ComitenteInversion: {
        select: { id: true, nombre: true, productor: true },
      },
    },
  });
  if (!cuenta) notFound();

  // Build query scope: ops linked via cuentaInversionId OR comitenteId
  const cids = cuenta.ComitenteInversion.map((c) => c.id);
  const acctWhere: Prisma.OperacionBolsaWhereInput =
    cids.length > 0
      ? { OR: [{ cuentaInversionId: id }, { comitenteId: { in: cids } }] }
      : { cuentaInversionId: id };

  // Config
  const configRows = await prisma.config.findMany({
    where: {
      clave: { in: ["bolsa_iibb_pct", "bolsa_banco_pct", "bolsa_ips_pct", "bolsa_otro_pct"] },
    },
  });
  const cfg = Object.fromEntries(configRows.map((r) => [r.clave, parseFloat(r.valor)]));
  const iibbPct  = cfg["bolsa_iibb_pct"]  ?? 3;
  const bancoPct = cfg["bolsa_banco_pct"] ?? 50;
  const ipsPct   = cfg["bolsa_ips_pct"]   ?? 40;
  const otroPct  = cfg["bolsa_otro_pct"]  ?? 40;

  // Fetch ops for selected month (concertadas or liquidadas only)
  const rawOps = await prisma.operacionBolsa.findMany({
    where: {
      ...acctWhere,
      anulada: false,
      estado: { in: ["CONCERTADA", "LIQUIDADA"] },
      fechaOperativa: { gte: mesStart, lt: mesEnd },
    },
    orderBy: [{ fechaOperativa: "asc" }, { fechaCarga: "asc" }],
    include: {
      ComitenteInversion: { select: { nombre: true, productor: true } },
      Cartera:            { select: { nombre: true } },
    },
  });

  // Build a map comitente.id → productor for quick lookup
  const comitenteProductor = new Map(
    cuenta.ComitenteInversion.map((c) => [c.id, c.productor as string]),
  );

  const ops: OpRow[] = rawOps.map((op) => {
    const productor =
      op.comitenteId
        ? (comitenteProductor.get(op.comitenteId) ?? op.ComitenteInversion?.productor ?? "BYG")
        : "BYG"; // cartera propia → BYG
    return {
      id:             op.id,
      fechaOperativa: op.fechaOperativa,
      tipoOperacion:  op.tipoOperacion as string,
      ticker:         op.ticker,
      cantidad:       Number(op.cantidad),
      precio:         Number(op.precio),
      moneda:         op.moneda as string,
      comisionPct:    op.comisionPct    != null ? Number(op.comisionPct)    : null,
      comisionFija:   op.comisionFija   != null ? Number(op.comisionFija)   : null,
      esSenebi:       op.esSenebi,
      senebiBruto:    op.senebiBruto    != null ? Number(op.senebiBruto)    : null,
      sujeto:         op.ComitenteInversion?.nombre ?? op.Cartera?.nombre ?? "Cartera Propia",
      productor,
    };
  });

  // ── Global totals ─────────────────────────────────────────────────────────
  const totalComisiones = ops
    .filter((o) => !o.esSenebi)
    .reduce((s, o) => s + comisionGenerada(o), 0);
  const senebiMes = ops
    .filter((o) => o.esSenebi)
    .reduce((s, o) => s + comisionGenerada(o), 0);
  const brutoTotal = totalComisiones + senebiMes;
  const iibb       = brutoTotal * (iibbPct / 100);
  const neto       = brutoTotal - iibb;
  const aCobrarBYG = neto * (bancoPct / 100);

  // ── Per-producer breakdown ────────────────────────────────────────────────
  const productores = Array.from(
    new Set(ops.map((o) => o.productor)),
  ).sort();

  type ProdBreakdown = {
    productor: string;
    bruto:     number;
    iibb:      number;
    neto:      number;
    aPagar:    number;
    retiene:   number;
  };

  function pctForProductor(p: string) {
    if (p === "IPS")  return ipsPct  / 100;
    if (p === "OTRO") return otroPct / 100;
    return 0; // BYG retains everything
  }

  const breakdown: ProdBreakdown[] = productores.map((p) => {
    const pOps   = ops.filter((o) => o.productor === p);
    const brutoP = pOps.reduce((s, o) => s + comisionGenerada(o), 0);
    const iibbP  = brutoP * (iibbPct / 100);
    const netoP  = brutoP - iibbP;
    const pct    = pctForProductor(p);
    const aPagar = netoP * pct;
    return {
      productor: p,
      bruto:     brutoP,
      iibb:      iibbP,
      neto:      netoP,
      aPagar,
      retiene:   netoP - aPagar,
    };
  });

  // Month navigation helpers
  const prevMes = (() => {
    const d = new Date(Date.UTC(year, month - 2, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  })();
  const nextMes = (() => {
    const d = new Date(Date.UTC(year, month, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  })();
  const isCurrentMonth = mes === mesCalendario;

  return (
    <div className="flex flex-col gap-8">
      {/* Breadcrumb */}
      <Link
        href={`/cuentas-inversion/${id}?tab=comisiones`}
        className="flex items-center gap-1 text-byg-muted hover:text-byg-accent text-[10px] font-black uppercase tracking-widest transition-colors group w-fit"
      >
        <ChevronLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
        Comisiones
      </Link>

      {/* Header + month picker */}
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-byg-muted mb-1">
            {cuenta.nombre} · Comisiones Bolsa
          </p>
          <h1 className="text-3xl font-black text-byg-text tracking-tight capitalize">{mesLabel}</h1>
        </div>

        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <Link
            href={`/cuentas-inversion/${id}/comisiones-mes?mes=${prevMes}`}
            className="px-3 py-1.5 rounded-lg border border-byg-border bg-byg-surface text-byg-muted hover:text-byg-accent hover:border-byg-accent/40 text-[11px] font-black transition-colors"
          >
            ←
          </Link>
          <span className="text-[11px] font-bold text-byg-text tabular-nums">{mes}</span>
          <Link
            href={`/cuentas-inversion/${id}/comisiones-mes?mes=${nextMes}`}
            className={`px-3 py-1.5 rounded-lg border border-byg-border bg-byg-surface text-byg-muted text-[11px] font-black transition-colors ${isCurrentMonth ? "opacity-30 pointer-events-none" : "hover:text-byg-accent hover:border-byg-accent/40"}`}
          >
            →
          </Link>
        </div>
      </header>

      {/* Global summary */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-byg-muted">
          Resumen global · {ops.length} operaciones
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Comisiones"       value={`ARS ${fmt(totalComisiones)}`} />
          <StatCard label="SENEBI"           value={`ARS ${fmt(senebiMes)}`} />
          <StatCard label="Bruto total"      value={`ARS ${fmt(brutoTotal)}`} sub={`IIBB ${iibbPct}% = ARS ${fmt(iibb)}`} />
          <StatCard label="Neto"             value={`ARS ${fmt(neto)}`} accent />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label={`A cobrar BYG (${bancoPct}%)`} value={`ARS ${fmt(aCobrarBYG)}`} accent />
          {breakdown.filter((b) => b.productor !== "BYG").map((b) => (
            <StatCard
              key={b.productor}
              label={`A pagar ${PRODUCTOR_LABEL[b.productor] ?? b.productor}`}
              value={`ARS ${fmt(b.aPagar)}`}
              sub={`${b.productor === "IPS" ? ipsPct : otroPct}% s/ ARS ${fmt(b.neto)} neto`}
            />
          ))}
        </div>
      </section>

      {/* Per-producer breakdown */}
      {breakdown.length > 0 && (
        <section className="bg-byg-surface rounded-2xl border border-byg-border overflow-hidden">
          <div className="px-6 py-4 border-b border-byg-border">
            <h2 className="text-[12px] font-bold uppercase tracking-widest text-byg-text">
              Desglose por productor
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-byg-border">
                  {["Productor", "Bruto", `IIBB (${iibbPct}%)`, "Neto", "A pagar", "BYG retiene"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-black uppercase tracking-widest text-byg-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {breakdown.map((b) => (
                  <tr key={b.productor} className="border-b border-byg-border/50 hover:bg-byg-surface-2/50 transition-colors">
                    <td className="px-5 py-3 font-black text-byg-text">{PRODUCTOR_LABEL[b.productor] ?? b.productor}</td>
                    <td className="px-5 py-3 font-mono tabular-nums text-byg-muted">ARS {fmt(b.bruto)}</td>
                    <td className="px-5 py-3 font-mono tabular-nums text-rose-400">− ARS {fmt(b.iibb)}</td>
                    <td className="px-5 py-3 font-mono tabular-nums text-byg-text font-bold">ARS {fmt(b.neto)}</td>
                    <td className="px-5 py-3 font-mono tabular-nums text-violet-400">
                      {b.aPagar > 0 ? `ARS ${fmt(b.aPagar)}` : "—"}
                    </td>
                    <td className="px-5 py-3 font-mono tabular-nums text-byg-accent font-bold">ARS {fmt(b.retiene)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Detail table */}
      <section className="bg-byg-surface rounded-2xl border border-byg-border overflow-hidden">
        <div className="px-6 py-4 border-b border-byg-border flex items-center justify-between">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-byg-text">
            Detalle de operaciones
          </h2>
          <span className="text-[10px] text-byg-muted font-mono">{ops.length} ops</span>
        </div>

        {ops.length === 0 ? (
          <p className="px-6 py-8 text-[12px] text-byg-muted text-center">
            Sin operaciones concertadas este mes.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-byg-border">
                  {["Fecha", "Sujeto", "Prod.", "Tipo", "Ticker", "Cantidad", "Precio", "Comis. %", "Comis. Fija", "SENEBI", "Total generado"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-black uppercase tracking-widest text-byg-muted whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ops.map((op) => {
                  const gen = comisionGenerada(op);
                  return (
                    <tr key={op.id} className="border-b border-byg-border/50 hover:bg-byg-surface-2/50 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-byg-muted whitespace-nowrap">{fmtDate(op.fechaOperativa)}</td>
                      <td className="px-4 py-2.5 text-byg-text max-w-[140px] truncate">{op.sujeto}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-byg-surface-2 text-byg-muted border border-byg-border">
                          {PRODUCTOR_LABEL[op.productor] ?? op.productor}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-byg-muted whitespace-nowrap">{TIPO_LABEL[op.tipoOperacion] ?? op.tipoOperacion}</td>
                      <td className="px-4 py-2.5 font-mono font-bold text-byg-text">{op.ticker}</td>
                      <td className="px-4 py-2.5 font-mono tabular-nums text-byg-muted text-right">{fmt(op.cantidad, 0)}</td>
                      <td className="px-4 py-2.5 font-mono tabular-nums text-byg-muted text-right">{fmt(op.precio, 4)}</td>
                      <td className="px-4 py-2.5 font-mono tabular-nums text-byg-muted text-right">
                        {op.comisionPct != null ? `${fmt(op.comisionPct, 4)}%` : "—"}
                      </td>
                      <td className="px-4 py-2.5 font-mono tabular-nums text-byg-muted text-right">
                        {op.comisionFija != null ? fmt(op.comisionFija) : "—"}
                      </td>
                      <td className="px-4 py-2.5 font-mono tabular-nums text-violet-400 text-right">
                        {op.esSenebi ? `ARS ${fmt(op.senebiBruto ?? 0)}` : "—"}
                      </td>
                      <td className="px-4 py-2.5 font-mono tabular-nums font-bold text-byg-accent text-right">
                        ARS {fmt(gen)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-byg-border bg-byg-surface-2/50">
                  <td colSpan={10} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-byg-muted text-right">Total</td>
                  <td className="px-4 py-3 font-mono tabular-nums font-black text-byg-accent text-right">
                    ARS {fmt(brutoTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* Config */}
      <section className="bg-byg-surface rounded-2xl border border-byg-border overflow-hidden">
        <div className="px-6 py-4 border-b border-byg-border">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-byg-text">
            Configuración de comisiones
          </h2>
        </div>
        <div className="px-6 py-5">
          <ConfigComisionesBolsaForm
            iibbPct={iibbPct}
            bancoPct={bancoPct}
            ipsPct={ipsPct}
            otroPct={otroPct}
          />
        </div>
      </section>
    </div>
  );
}
