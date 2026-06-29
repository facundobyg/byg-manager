import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ProductorInversion } from "@prisma/client";
import { getProductoresConfig, getMesOperativo } from "@/lib/services/config.service";
import { hasPermission } from "@/lib/auth/permissions";
import { CreateComitenteModal }  from "@/components/modules/cuentas-inversion/CreateComitenteModal";
import { EditComitenteForm }     from "@/components/modules/cuentas-inversion/EditComitenteForm";
import { EditSaldosForm }        from "@/components/modules/cuentas-inversion/EditSaldosForm";
import { DeleteComitenteButton } from "@/components/modules/cuentas-inversion/DeleteComitenteButton";
import { ReportesFilters }       from "./ReportesFilters";
import { CsvDownloadButton }     from "./CsvDownloadButton";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number, dec = 2) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtDate(v: Date | null) {
  if (!v) return "—";
  return v.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
}

function csvCell(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

const PRODUCTOR_LABEL: Record<ProductorInversion, string> = { IPS: "IPS", BYG: "BYG", OTRO: "Otro" };
const PRODUCTOR_CLS: Record<ProductorInversion, string> = {
  IPS:  "bg-violet-50 text-violet-700",
  BYG:  "bg-blue-50 text-blue-700",
  OTRO: "bg-slate-100 text-slate-600",
};

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

// Tipo filter groups
const TIPO_GRUPOS: Record<string, string[]> = {
  bonos:    ["COMPRA_BONO",   "VENTA_BONO"],
  acciones: ["COMPRA_ACCION", "VENTA_ACCION"],
  cedear:   ["COMPRA_CEDEAR", "VENTA_CEDEAR"],
  caucion:  ["CAUCION_COLOCADORA", "CAUCION_TOMADORA"],
  opciones: ["OPCION_CALL",   "OPCION_PUT"],
  futuros:  ["FUTURO"],
  mep:      ["MEP", "SENEBI"],
};

// ── Types ─────────────────────────────────────────────────────────────────────

type ComRow = {
  id: string;
  fechaOperativa: Date | null;
  tipoOperacion: string;
  ticker: string;
  cantidad: number;
  precio: number;
  moneda: string;
  resultadoBruto: number | null;
  comisionPct: number | null;
  comisionFija: number | null;
  operador: string;
  sujeto: string;
};

type ReportOp = {
  id:                string;
  fechaConcertacion: Date | null;
  tipoOperacion:     string;
  ticker:            string;
  cantidad:          number;
  precio:            number;
  moneda:            string;
  comisionPct:       number | null;
  comisionFija:      number | null;
  esSenebi:          boolean;
  senebiBruto:       number | null;
  sujeto:            string;
  comitenteId:       string | null;
  estado:            string;
  operador:          string;
};

type ClienteResumen = {
  sujeto:         string;
  comitenteId:    string | null;
  opsCount:       number;
  comisionNormal: number;
  senebi:         number;
  bruto:          number;
  iibb:           number;
  neto:           number;
  aPagar:         number;
  retiene:        number;
};

function comGenReport(op: ReportOp): number {
  if (op.esSenebi) return op.senebiBruto ?? 0;
  const vb = op.cantidad * op.precio;
  return (op.comisionFija ?? 0) + vb * ((op.comisionPct ?? 0) / 100);
}

// ── UI Components ─────────────────────────────────────────────────────────────

function TabLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-4 py-2.5 text-xs font-bold border-b-2 -mb-px transition-colors whitespace-nowrap ${
        active ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      {children}
    </Link>
  );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-1">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <div className="text-3xl font-black text-slate-900 tabular-nums">{value}</div>
    </div>
  );
}

function ResumeCard({
  label, value, sub, hl,
}: { label: string; value: string; sub?: string; hl?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-0.5 ${hl ? "border-t-[3px] " + hl : ""}`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`text-lg font-black tabular-nums font-mono ${hl ? hl.replace("border-t-", "text-") : "text-slate-900"}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-400 font-mono">{sub}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CuentaInversionPage({
  params,
  searchParams,
}: {
  params:       Promise<{ id: string }>;
  searchParams: Promise<{
    editId?: string; editSaldosId?: string; tab?: string;
    productor?: string; mes?: string;
    clienteId?: string; estado?: string; tipo?: string;
  }>;
}) {
  const { id } = await params;
  const {
    editId, editSaldosId,
    tab: tabParam,
    productor: prodParam, mes: mesParam,
    clienteId: clienteIdParam, estado: estadoParam, tipo: tipoParam,
  } = await searchParams;

  const tab = (tabParam === "comitentes" || !tabParam) ? "clientes" : tabParam;

  // Reportes filter params — default month = mes operativo activo
  const now            = new Date();
  const mesCalendario  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const reportProductor: "IPS" | "BYG" | "OTRO" =
    prodParam === "BYG" || prodParam === "OTRO" ? prodParam : "IPS";
  const reportClienteId  = clienteIdParam ?? "all";
  const reportEstado     = estadoParam    ?? "all";
  const reportTipo       = tipoParam      ?? "all";

  const canImportar = await hasPermission("holdings:editar");

  const [cuenta, mirroredCarteras, productores, mesOperativo] = await Promise.all([
    prisma.cuentaInversion.findUnique({
      where: { id },
      include: {
        ComitenteInversion: {
          orderBy: { nroComitente: "asc" },
          include: {
            SaldoComitenteInversion: true,
            Cartera: { select: { slug: true, nombre: true, mirrorInInvestmentAccounts: true } },
            _count: { select: { HoldingComitenteInversion: true } },
          },
        },
      },
    }),
    prisma.cartera.findMany({
      where: { mirrorInInvestmentAccounts: true, comitenteNumber: { not: null } },
      select: {
        id: true, nombre: true, slug: true, comitenteNumber: true,
        investmentAccountType: true, saldoPesos: true, saldoUSDCable: true, saldoUSDMep: true,
        _count: { select: { PosicionCartera: true } },
      },
      orderBy: { nombre: "asc" },
    }),
    getProductoresConfig(),
    getMesOperativo(),
  ]);

  if (!cuenta) notFound();

  const baseUrl = `/cuentas-inversion/${id}`;

  // Reportes derived vars (depend on mesOperativo resolved above)
  const reportMes      = mesParam      ?? mesOperativo;
  const [rYear, rMonth] = reportMes.split("-").map(Number);
  const reportMesStart  = new Date(Date.UTC(rYear, rMonth - 1, 1));
  const reportMesEnd    = new Date(Date.UTC(rYear, rMonth, 1));
  const reportMesLabel  = reportMesStart.toLocaleDateString("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });
  const reportPrevMes   = (() => { const d = new Date(Date.UTC(rYear, rMonth - 2, 1)); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`; })();
  const reportNextMes   = (() => { const d = new Date(Date.UTC(rYear, rMonth, 1));     return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`; })();
  const isCurrentMes    = reportMes === mesCalendario;

  const clienteComitentes = cuenta.ComitenteInversion.filter((c) => !c.esPropioBYG);
  const propiosComitentes = cuenta.ComitenteInversion.filter((c) =>  c.esPropioBYG);
  const activeClientes    = clienteComitentes.filter((c) => c.activo);
  const holdingsClientes  = activeClientes.reduce((s, c) => s + c._count.HoldingComitenteInversion, 0);
  const holdingsPropios   = propiosComitentes.reduce((s, c) => s + c._count.HoldingComitenteInversion, 0);

  const comitenteProductorMap = new Map(
    cuenta.ComitenteInversion.map((c) => [c.id, c.productor as string]),
  );

  // ── Comisiones data ───────────────────────────────────────────────────────
  let comisionesStats: { pendientesCount: number; concertadasCount: number; liquidadasCount: number; totalMesCount: number } | null = null;
  let pendientesOps: ComRow[] = [];

  if (tab === "comisiones") {
    const cids = cuenta.ComitenteInversion.map((c) => c.id);
    const acctWhere: Prisma.OperacionBolsaWhereInput =
      cids.length > 0
        ? { OR: [{ cuentaInversionId: id }, { comitenteId: { in: cids } }] }
        : { cuentaInversionId: id };

    const mes1 = new Date(now.getFullYear(), now.getMonth(), 1);
    const mes2 = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [cnt0, cnt1, cnt2, cnt3, rawOps] = await Promise.all([
      prisma.operacionBolsa.count({ where: { ...acctWhere, anulada: false, estado: "PENDIENTE_CONCERTACION" } }),
      prisma.operacionBolsa.count({ where: { ...acctWhere, anulada: false, estado: "CONCERTADA" } }),
      prisma.operacionBolsa.count({ where: { ...acctWhere, anulada: false, estado: "LIQUIDADA" } }),
      prisma.operacionBolsa.count({ where: { ...acctWhere, anulada: false, fechaOperativa: { gte: mes1, lt: mes2 } } }),
      prisma.operacionBolsa.findMany({
        where: { ...acctWhere, anulada: false, estado: "PENDIENTE_CONCERTACION" },
        orderBy: [{ fechaOperativa: "asc" }, { fechaCarga: "asc" }],
        include: {
          ComitenteInversion: { select: { nombre: true } },
          Cartera:            { select: { nombre: true } },
          OperadorCarga:      { select: { name: true } },
        },
      }),
    ]);

    comisionesStats = { pendientesCount: cnt0, concertadasCount: cnt1, liquidadasCount: cnt2, totalMesCount: cnt3 };
    pendientesOps = rawOps.map((op) => ({
      id:             op.id,
      fechaOperativa: op.fechaOperativa,
      tipoOperacion:  op.tipoOperacion as string,
      ticker:         op.ticker,
      cantidad:       Number(op.cantidad),
      precio:         Number(op.precio),
      moneda:         op.moneda as string,
      resultadoBruto: op.resultadoBruto !== null ? Number(op.resultadoBruto) : null,
      comisionPct:    op.comisionPct    !== null ? Number(op.comisionPct)    : null,
      comisionFija:   op.comisionFija   !== null ? Number(op.comisionFija)   : null,
      operador:       op.OperadorCarga.name ?? "—",
      sujeto:         op.ComitenteInversion?.nombre ?? op.Cartera?.nombre ?? "—",
    }));
  }

  const opsByFecha = new Map<string, ComRow[]>();
  for (const op of pendientesOps) {
    const key = op.fechaOperativa ? op.fechaOperativa.toISOString().split("T")[0] : "sin-fecha";
    if (!opsByFecha.has(key)) opsByFecha.set(key, []);
    opsByFecha.get(key)!.push(op);
  }

  // ── Reportes data ─────────────────────────────────────────────────────────
  let allProductorOps: ReportOp[] = []; // filtered by productor only — for dropdown
  let reportOps:       ReportOp[] = []; // fully filtered — for display
  let reportCfg = { iibbPct: 3, ipsPct: 40, otroPct: 40 };
  let clienteResumenes: ClienteResumen[] = [];
  let reportCsv = "";

  if (tab === "reportes") {
    const cids = cuenta.ComitenteInversion.map((c) => c.id);
    const acctWhere: Prisma.OperacionBolsaWhereInput =
      cids.length > 0
        ? { OR: [{ cuentaInversionId: id }, { comitenteId: { in: cids } }] }
        : { cuentaInversionId: id };

    // Push estado filter into DB query
    const estadoWhere =
      reportEstado === "CONCERTADA" ? { estado: "CONCERTADA" as const } :
      reportEstado === "LIQUIDADA"  ? { estado: "LIQUIDADA"  as const } :
      { estado: { in: ["CONCERTADA" as const, "LIQUIDADA" as const] } };

    const [rawOps, cfgRows] = await Promise.all([
      prisma.operacionBolsa.findMany({
        where: {
          ...acctWhere,
          ...estadoWhere,
          anulada: false,
          fechaConcertacion: { gte: reportMesStart, lt: reportMesEnd },
        },
        orderBy: [{ fechaConcertacion: "asc" }, { fechaCarga: "asc" }],
        include: {
          ComitenteInversion: { select: { nombre: true, productor: true } },
          Cartera:            { select: { nombre: true } },
          OperadorCarga:      { select: { name: true } },
        },
      }),
      prisma.config.findMany({
        where: { clave: { in: ["bolsa_iibb_pct", "bolsa_ips_pct", "bolsa_otro_pct"] } },
      }),
    ]);

    const cfgMap = Object.fromEntries(cfgRows.map((r) => [r.clave, parseFloat(r.valor)]));
    reportCfg = {
      iibbPct: cfgMap["bolsa_iibb_pct"] ?? 3,
      ipsPct:  cfgMap["bolsa_ips_pct"]  ?? 40,
      otroPct: cfgMap["bolsa_otro_pct"] ?? 40,
    };

    const allMapped: ReportOp[] = rawOps.map((op) => ({
      id:                op.id,
      fechaConcertacion: op.fechaConcertacion,
      tipoOperacion:     op.tipoOperacion as string,
      ticker:            op.ticker,
      cantidad:          Number(op.cantidad),
      precio:            Number(op.precio),
      moneda:            op.moneda as string,
      comisionPct:       op.comisionPct    != null ? Number(op.comisionPct)    : null,
      comisionFija:      op.comisionFija   != null ? Number(op.comisionFija)   : null,
      esSenebi:          op.esSenebi,
      senebiBruto:       op.senebiBruto    != null ? Number(op.senebiBruto)    : null,
      sujeto:            op.ComitenteInversion?.nombre ?? op.Cartera?.nombre ?? "Cartera Propia",
      comitenteId:       op.comitenteId,
      estado:            op.estado as string,
      operador:          op.OperadorCarga.name ?? "—",
    }));

    // Filter by productor (code-side) → used for client dropdown
    allProductorOps = allMapped.filter((op) => {
      const prod = op.comitenteId
        ? (comitenteProductorMap.get(op.comitenteId) ?? "BYG")
        : "BYG";
      return prod === reportProductor;
    });

    // Apply additional filters → final report dataset
    reportOps = allProductorOps
      .filter((op) =>
        reportClienteId === "all" ||
        (reportClienteId === "__cartera__" ? op.comitenteId === null : op.comitenteId === reportClienteId),
      )
      .filter((op) =>
        reportTipo === "all" ||
        (TIPO_GRUPOS[reportTipo]?.includes(op.tipoOperacion) ?? false),
      );

    // Aggregate per client
    const porClienteMap = new Map<string, ClienteResumen>();
    for (const op of reportOps) {
      const key = op.comitenteId ?? ("__c__" + op.sujeto);
      if (!porClienteMap.has(key)) {
        porClienteMap.set(key, {
          sujeto: op.sujeto, comitenteId: op.comitenteId,
          opsCount: 0, comisionNormal: 0, senebi: 0,
          bruto: 0, iibb: 0, neto: 0, aPagar: 0, retiene: 0,
        });
      }
      const r = porClienteMap.get(key)!;
      const gen = comGenReport(op);
      r.opsCount++;
      if (op.esSenebi) { r.senebi += gen; } else { r.comisionNormal += gen; }
      r.bruto += gen;
    }
    const { iibbPct, ipsPct, otroPct } = reportCfg;
    const pctProd = reportProductor === "IPS" ? ipsPct : reportProductor === "OTRO" ? otroPct : 0;
    for (const r of Array.from(porClienteMap.values())) {
      r.iibb    = r.bruto * (iibbPct / 100);
      r.neto    = r.bruto - r.iibb;
      r.aPagar  = r.neto * (pctProd / 100);
      r.retiene = r.neto - r.aPagar;
    }
    clienteResumenes = Array.from(porClienteMap.values()).sort((a, b) => b.bruto - a.bruto);
  }

  // Resumen ejecutivo totals (from reportOps)
  const { iibbPct, ipsPct, otroPct } = reportCfg;
  const pctProductor   = reportProductor === "IPS" ? ipsPct : reportProductor === "OTRO" ? otroPct : 0;
  const rTotalNormal   = reportOps.filter((o) => !o.esSenebi).reduce((s, o) => s + comGenReport(o), 0);
  const rSenebi        = reportOps.filter((o) =>  o.esSenebi).reduce((s, o) => s + comGenReport(o), 0);
  const rBruto         = rTotalNormal + rSenebi;
  const rIibb          = rBruto * (iibbPct / 100);
  const rNeto          = rBruto - rIibb;
  const rAPagar        = rNeto * (pctProductor / 100);
  const rRetiene       = rNeto - rAPagar;

  // Build CSV (server-side, passed to CsvDownloadButton as string)
  if (tab === "reportes") {
    const rows: string[] = [];
    const row = (...cells: (string | number | null | undefined)[]) =>
      rows.push(cells.map(csvCell).join(","));

    row("REPORTE DE COMISIONES — BANCO INDUSTRIAL");
    row("Productor", PRODUCTOR_LABEL[reportProductor], "Mes", reportMesLabel);
    row("Filtros", `Estado: ${reportEstado}`, `Tipo: ${reportTipo}`, `Cliente: ${reportClienteId}`);
    rows.push("");

    row("RESUMEN EJECUTIVO");
    row("Comisiones normales",    rTotalNormal);
    row("SENEBI",                 rSenebi);
    row("Bruto total",            rBruto);
    row(`IIBB (${iibbPct}%)`,     rIibb);
    row("Neto",                   rNeto);
    row(`% ${reportProductor}`,   pctProductor);
    row("A pagar productor",      rAPagar);
    row("Retiene BYG",            rRetiene);
    rows.push("");

    row("DETALLE POR CLIENTE");
    row("Cliente", "Cant. Ops", "Comisión Normal", "SENEBI", "Bruto", `IIBB (${iibbPct}%)`, "Neto", "A pagar", "Retiene BYG");
    for (const r of clienteResumenes) {
      row(r.sujeto, r.opsCount, r.comisionNormal, r.senebi, r.bruto, r.iibb, r.neto, r.aPagar, r.retiene);
    }
    rows.push("");

    row("DETALLE OPERACIONES");
    row("Fecha Concert.", "Cliente", "Tipo", "Ticker", "Cantidad", "Precio", "Moneda", "Comisión Normal", "SENEBI", "Total Generado", "Estado", "Operador");
    for (const op of reportOps) {
      const gen     = comGenReport(op);
      const comNorm = op.esSenebi ? 0 : gen;
      const senebi  = op.esSenebi ? gen : 0;
      row(
        fmtDate(op.fechaConcertacion),
        op.sujeto,
        TIPO_LABEL[op.tipoOperacion] ?? op.tipoOperacion,
        op.ticker,
        op.cantidad,
        op.precio,
        op.moneda,
        comNorm,
        senebi,
        gen,
        op.estado,
        op.operador,
      );
    }
    reportCsv = rows.join("\n");
  }

  // Unique clients for the filter dropdown (from productor-filtered ops only)
  const clienteOptions = Array.from(
    new Map(allProductorOps.map((op) => [
      op.comitenteId ?? "__cartera__",
      op.sujeto,
    ])).entries(),
  )
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const csvFilename = `reporte-comisiones-${reportProductor.toLowerCase()}-${reportMes}.csv`;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <header className="flex flex-row items-end justify-between">
        <div>
          <Link
            href="/cuentas-inversion"
            className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 hover:text-blue-700 transition-colors"
          >
            ← Cuentas de Inversión
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">{cuenta.nombre}</h1>
          <p className="text-slate-500 mt-1 text-sm">Clientes, carteras y comisiones</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`${baseUrl}/precios`} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
            Actualizar precios
          </Link>
          {canImportar && (
            <Link href="/cuentas-inversion/importar" className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
              Importar
            </Link>
          )}
          {tab === "clientes" && <CreateComitenteModal cuentaInversionId={id} productores={productores} canImportar={canImportar} />}
          {!cuenta.activa && (
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-slate-100 text-slate-500">Inactiva</span>
          )}
        </div>
      </header>

      {/* Tab nav */}
      <div className="flex items-center border-b border-slate-200">
        <TabLink href={`${baseUrl}?tab=clientes`}   active={tab === "clientes"}>Clientes</TabLink>
        <TabLink href={`${baseUrl}?tab=carteras`}   active={tab === "carteras"}>Carteras propias</TabLink>
        <TabLink href={`${baseUrl}?tab=comisiones`} active={tab === "comisiones"}>Comisiones</TabLink>
        <TabLink href={`${baseUrl}?tab=reportes`}   active={tab === "reportes"}>Reportes</TabLink>
      </div>

      {/* ── Tab: Clientes ─────────────────────────────────────────────────── */}
      {tab === "clientes" && (
        <section className="flex flex-col gap-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Clientes activos"  value={activeClientes.length} />
            <StatCard label="Holdings clientes" value={holdingsClientes} />
            <StatCard label="Actualizado" value={<span className="text-sm">{cuenta.updatedAt.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>} />
          </div>

          {clienteComitentes.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm text-slate-400 italic">Sin clientes. Usar "Nuevo Comitente" arriba.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["N° Comitente", "Cliente", "Productor", "ARS", "USD Cable", "USD MEP", "Holdings", ""].map((h, i) => (
                      <th key={h || `col-${i}`} className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ${i < 3 || i === 7 ? "text-left" : "text-right"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clienteComitentes.map((c) => {
                    const ars   = Number(c.SaldoComitenteInversion?.saldoARS      ?? 0);
                    const cable = Number(c.SaldoComitenteInversion?.saldoUSDCable  ?? 0);
                    const mep   = Number(c.SaldoComitenteInversion?.saldoUSDMep    ?? 0);
                    const isEditingData   = editId === c.id;
                    const isEditingSaldos = editSaldosId === c.id;
                    return (
                      <React.Fragment key={c.id}>
                        <tr className={`border-b border-slate-50 last:border-0 transition-colors ${isEditingData || isEditingSaldos ? "bg-slate-50" : c.activo ? "bg-white hover:bg-slate-50/60" : "bg-slate-50 opacity-60"}`}>
                          <td className="px-4 py-3 font-mono text-slate-700 font-semibold">{c.nroComitente}</td>
                          <td className="px-4 py-3 font-medium">
                            <Link href={`${baseUrl}/comitentes/${c.id}`} className="text-slate-800 hover:text-blue-600 transition-colors">{c.nombre ?? c.razonSocial}</Link>
                            {c.nombre && c.razonSocial && <span className="block text-[10px] text-slate-400 font-normal">{c.razonSocial}</span>}
                            {!c.activo && <span className="ml-1 text-[10px] text-slate-400 font-bold">(inactivo)</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${PRODUCTOR_CLS[c.productor]}`}>{PRODUCTOR_LABEL[c.productor]}</span>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-600">{ars !== 0 ? `$ ${fmt(ars)}` : <span className="text-slate-300">—</span>}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-600">{cable !== 0 ? `USD ${fmt(cable)}` : <span className="text-slate-300">—</span>}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-600">{mep !== 0 ? `USD ${fmt(mep)}` : <span className="text-slate-300">—</span>}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-600 font-medium">{c._count.HoldingComitenteInversion}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Link href={isEditingData ? `${baseUrl}?tab=clientes` : `${baseUrl}?tab=clientes&editId=${c.id}`} className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${isEditingData ? "bg-amber-100 text-amber-700" : "text-slate-500 hover:bg-amber-50 hover:text-amber-600"}`}>Editar</Link>
                              <Link href={isEditingSaldos ? `${baseUrl}?tab=clientes` : `${baseUrl}?tab=clientes&editSaldosId=${c.id}`} className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${isEditingSaldos ? "bg-emerald-100 text-emerald-700" : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"}`}>Saldos</Link>
                              <DeleteComitenteButton id={c.id} cuentaInversionId={id} />
                            </div>
                          </td>
                        </tr>
                        {isEditingData && (
                          <tr className="bg-amber-50/50">
                            <td colSpan={8} className="px-4 py-4">
                              <EditComitenteForm id={c.id} cuentaInversionId={id} nroComitente={c.nroComitente} nombre={c.nombre} razonSocial={c.razonSocial} productor={c.productor} notas={c.notas} activo={c.activo} esPropioBYG={c.esPropioBYG} cancelHref={`${baseUrl}?tab=clientes`} productores={productores} />
                            </td>
                          </tr>
                        )}
                        {isEditingSaldos && (
                          <tr className="bg-emerald-50/30">
                            <td colSpan={8} className="px-4 py-4">
                              <EditSaldosForm comitenteId={c.id} cuentaInversionId={id} saldoARS={ars} saldoUSDCable={cable} saldoUSDMep={mep} cancelHref={`${baseUrl}?tab=clientes`} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ── Tab: Carteras propias ─────────────────────────────────────────── */}
      {tab === "carteras" && (
        <section className="flex flex-col gap-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Carteras propias" value={propiosComitentes.length + mirroredCarteras.length} />
            <StatCard label="Holdings propios"  value={holdingsPropios} />
            <StatCard label="Actualizado" value={<span className="text-sm">{cuenta.updatedAt.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>} />
          </div>

          {propiosComitentes.length === 0 && mirroredCarteras.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm text-slate-400 italic">Sin carteras propias vinculadas.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["Cartera", "Comitente espejo", "ARS", "USD Cable", "USD MEP", "Holdings", ""].map((h, i) => (
                      <th key={h || `col-${i}`} className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ${i < 2 || i === 6 ? "text-left" : "text-right"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {propiosComitentes.map((c) => {
                    const ars   = Number(c.SaldoComitenteInversion?.saldoARS      ?? 0);
                    const cable = Number(c.SaldoComitenteInversion?.saldoUSDCable  ?? 0);
                    const mep   = Number(c.SaldoComitenteInversion?.saldoUSDMep    ?? 0);
                    return (
                      <tr key={c.id} className="border-b border-slate-50 last:border-0 bg-white hover:bg-violet-50/40 transition-colors">
                        <td className="px-4 py-3 font-medium">
                          {c.Cartera
                            ? <Link href={`/carteras/${c.Cartera.slug}`} className="text-slate-800 hover:text-violet-600 transition-colors font-semibold">{c.Cartera.nombre}</Link>
                            : <span className="text-slate-500 italic">{c.nombre ?? "—"}</span>}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          <span className="text-slate-400">{c.nroComitente}</span>
                          {c.nombre && <span className="ml-2 text-slate-700">{c.nombre}</span>}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600">{ars !== 0 ? `$ ${fmt(ars)}` : <span className="text-slate-300">—</span>}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600">{cable !== 0 ? `USD ${fmt(cable)}` : <span className="text-slate-300">—</span>}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600">{mep !== 0 ? `USD ${fmt(mep)}` : <span className="text-slate-300">—</span>}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600 font-medium">{c._count.HoldingComitenteInversion}</td>
                        <td className="px-4 py-3">
                          {c.Cartera && <Link href={`/carteras/${c.Cartera.slug}`} className="px-2 py-1 rounded-lg text-[10px] font-bold text-violet-500 hover:bg-violet-100 hover:text-violet-700 transition-colors">Ver cartera</Link>}
                        </td>
                      </tr>
                    );
                  })}
                  {mirroredCarteras.map((cartera) => {
                    const ars   = Number(cartera.saldoPesos);
                    const cable = Number(cartera.saldoUSDCable);
                    const mep   = Number(cartera.saldoUSDMep);
                    return (
                      <tr key={cartera.id} className="border-b border-violet-100 last:border-0 bg-violet-50/30 hover:bg-violet-50/70 transition-colors">
                        <td className="px-4 py-3 font-medium">
                          <Link href={`/carteras/${cartera.slug}`} className="text-slate-800 hover:text-violet-600 transition-colors font-semibold">{cartera.nombre}</Link>
                          {cartera.investmentAccountType && <span className="block text-[10px] text-slate-400 font-normal">{cartera.investmentAccountType}</span>}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400">{cartera.comitenteNumber}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600">{ars !== 0 ? `$ ${fmt(ars)}` : <span className="text-slate-300">—</span>}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600">{cable !== 0 ? `USD ${fmt(cable)}` : <span className="text-slate-300">—</span>}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600">{mep !== 0 ? `USD ${fmt(mep)}` : <span className="text-slate-300">—</span>}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600 font-medium">{cartera._count.PosicionCartera}</td>
                        <td className="px-4 py-3">
                          <Link href={`/carteras/${cartera.slug}`} className="px-2 py-1 rounded-lg text-[10px] font-bold text-violet-500 hover:bg-violet-100 hover:text-violet-700 transition-colors">Ver cartera</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ── Tab: Comisiones ─────────────────────────────────────────────────── */}
      {tab === "comisiones" && comisionesStats && (
        <section className="flex flex-col gap-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 border-t-[3px] border-t-amber-400 shadow-sm p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Pendientes revisión</p>
              <p className="text-3xl font-black tabular-nums text-amber-500">{comisionesStats.pendientesCount}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 border-t-[3px] border-t-blue-500 shadow-sm p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Concertadas</p>
              <p className="text-3xl font-black tabular-nums text-blue-600">{comisionesStats.concertadasCount}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 border-t-[3px] border-t-emerald-500 shadow-sm p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Liquidadas</p>
              <p className="text-3xl font-black tabular-nums text-emerald-600">{comisionesStats.liquidadasCount}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total del mes</p>
              <p className="text-3xl font-black tabular-nums text-slate-900">{comisionesStats.totalMesCount}</p>
            </div>
          </div>
          <div className="flex justify-end">
            <Link href={`${baseUrl}/comisiones-mes`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest bg-byg-accent text-white hover:bg-blue-500 transition-colors shadow-sm shadow-blue-600/20">
              Cálculo del mes →
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Pendientes de revisión</h2>
            {pendientesOps.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                <p className="text-sm text-slate-400 italic">Sin operaciones pendientes de revisión.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[900px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        {[{ h: "Fecha", align: "left" }, { h: "Comitente/Cartera", align: "left" }, { h: "Tipo", align: "left" }, { h: "Ticker", align: "left" }, { h: "Cantidad", align: "right" }, { h: "Precio", align: "right" }, { h: "Mon.", align: "left" }, { h: "Resultado est.", align: "right" }, { h: "Comisión", align: "right" }, { h: "Operador", align: "left" }, { h: "Estado", align: "left" }, { h: "", align: "left" }].map(({ h, align }, i) => (
                          <th key={h || `col-${i}`} className={`px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap text-${align}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from(opsByFecha.entries()).map(([fecha, ops]) => (
                        <React.Fragment key={fecha}>
                          <tr className="bg-slate-50/80 border-y border-slate-100">
                            <td colSpan={12} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                              {fecha === "sin-fecha" ? "Sin fecha operativa" : new Date(fecha + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                            </td>
                          </tr>
                          {ops.map((op) => (
                            <tr key={op.id} className="border-b border-slate-50 last:border-0 bg-white hover:bg-amber-50/20 transition-colors">
                              <td className="px-3 py-3 font-mono text-slate-500 whitespace-nowrap">{op.fechaOperativa ? op.fechaOperativa.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }) : "—"}</td>
                              <td className="px-3 py-3 font-medium text-slate-800 max-w-[160px] truncate">{op.sujeto}</td>
                              <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{TIPO_LABEL[op.tipoOperacion] ?? op.tipoOperacion}</td>
                              <td className="px-3 py-3"><span className="font-black text-slate-900 tracking-tight">{op.ticker}</span></td>
                              <td className="px-3 py-3 text-right tabular-nums font-mono text-slate-700">{fmt(op.cantidad)}</td>
                              <td className="px-3 py-3 text-right tabular-nums font-mono text-slate-700">{fmt(op.precio)}</td>
                              <td className="px-3 py-3 text-slate-400">{op.moneda}</td>
                              <td className="px-3 py-3 text-right tabular-nums font-mono">
                                {op.resultadoBruto !== null ? <span className={op.resultadoBruto >= 0 ? "text-emerald-600" : "text-red-500"}>{fmt(op.resultadoBruto)}</span> : <span className="text-slate-300 italic text-[10px]">Sin cargar</span>}
                              </td>
                              <td className="px-3 py-3 text-right tabular-nums text-slate-500 whitespace-nowrap">
                                {op.comisionPct !== null ? `${op.comisionPct}%` : op.comisionFija !== null ? `$ ${fmt(op.comisionFija)}` : <span className="text-slate-300 italic text-[10px]">Sin cargar</span>}
                              </td>
                              <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{op.operador}</td>
                              <td className="px-3 py-3"><span className="text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 whitespace-nowrap">Pendiente revisión</span></td>
                              <td className="px-3 py-3"><Link href={`/bolsa/${op.id}`} className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm shadow-amber-500/20 whitespace-nowrap">Revisar →</Link></td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Tab: Reportes ─────────────────────────────────────────────────── */}
      {tab === "reportes" && (
        <section className="flex flex-col gap-8">

          {/* ── Filtros ──────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* Row 1: productor + mes + export */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Productor */}
              <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-1">
                {(["IPS", "BYG", "OTRO"] as const).map((p) => (
                  <Link
                    key={p}
                    href={`${baseUrl}?tab=reportes&productor=${p}&mes=${reportMes}&clienteId=${reportClienteId}&estado=${reportEstado}&tipo=${reportTipo}`}
                    className={`px-4 py-1.5 rounded-md text-[11px] font-black uppercase tracking-widest transition-all ${
                      reportProductor === p ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {p === "OTRO" ? "Otro" : p}
                  </Link>
                ))}
              </div>

              {/* Mes */}
              <div className="flex items-center gap-2">
                <Link
                  href={`${baseUrl}?tab=reportes&productor=${reportProductor}&mes=${reportPrevMes}&clienteId=${reportClienteId}&estado=${reportEstado}&tipo=${reportTipo}`}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-300 text-[11px] font-black transition-colors"
                >
                  ←
                </Link>
                <span className="text-[12px] font-bold text-slate-700 tabular-nums capitalize min-w-[140px] text-center">
                  {reportMesLabel}
                </span>
                <Link
                  href={`${baseUrl}?tab=reportes&productor=${reportProductor}&mes=${reportNextMes}&clienteId=${reportClienteId}&estado=${reportEstado}&tipo=${reportTipo}`}
                  className={`px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-black transition-colors ${
                    isCurrentMes ? "opacity-30 pointer-events-none text-slate-400" : "text-slate-500 hover:text-blue-600 hover:border-blue-300"
                  }`}
                >
                  →
                </Link>
              </div>

              <span className="text-[10px] text-slate-400 font-mono">{reportOps.length} ops</span>

              <div className="ml-auto flex items-center gap-2">
                <CsvDownloadButton csv={reportCsv} filename={csvFilename} />
              </div>
            </div>

            {/* Row 2: selects de cliente / estado / tipo */}
            <ReportesFilters
              basePath={baseUrl}
              productor={reportProductor}
              mes={reportMes}
              clienteId={reportClienteId}
              estado={reportEstado}
              tipo={reportTipo}
              clientes={clienteOptions}
            />

            {/* Nota historial */}
            <p className="text-[10px] text-slate-400 italic">
              Reporte del mes seleccionado. Los meses cerrados quedan disponibles como historial.
            </p>
          </div>

          {/* ── Reporte 1 — Resumen ejecutivo ────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              Resumen ejecutivo · {PRODUCTOR_LABEL[reportProductor]} · <span className="capitalize">{reportMesLabel}</span>
            </h2>

            {reportOps.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                <p className="text-sm text-slate-400 italic">
                  Sin operaciones concertadas para {PRODUCTOR_LABEL[reportProductor]} con los filtros aplicados.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <ResumeCard label="Comisiones normales" value={`ARS ${fmt(rTotalNormal)}`} />
                  <ResumeCard label="SENEBI"              value={`ARS ${fmt(rSenebi)}`}      hl={rSenebi > 0 ? "border-t-violet-500" : undefined} />
                  <ResumeCard label="Bruto total"         value={`ARS ${fmt(rBruto)}`} />
                  <ResumeCard label={`IIBB ${iibbPct}%`}  value={`− ARS ${fmt(rIibb)}`}      hl="border-t-rose-400" sub={`s/ ARS ${fmt(rBruto)}`} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <ResumeCard label="Neto"                                value={`ARS ${fmt(rNeto)}`}    hl="border-t-blue-500" />
                  <ResumeCard label={`% ${PRODUCTOR_LABEL[reportProductor]}`} value={`${pctProductor}%`} sub="sobre neto" />
                  <ResumeCard
                    label={`A pagar ${PRODUCTOR_LABEL[reportProductor]}`}
                    value={rAPagar > 0 ? `ARS ${fmt(rAPagar)}` : "—"}
                    hl={rAPagar > 0 ? "border-t-emerald-500" : undefined}
                    sub={rAPagar > 0 ? `${pctProductor}% s/ ARS ${fmt(rNeto)}` : undefined}
                  />
                  <ResumeCard label="Retiene BYG" value={`ARS ${fmt(rRetiene)}`} hl="border-t-blue-500" />
                </div>
              </>
            )}
          </div>

          {/* ── Reporte 2 — Detalle por cliente ─────────────────────────── */}
          {clienteResumenes.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Detalle por cliente</h2>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[900px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        {[
                          { h: "Cliente",         align: "left"  },
                          { h: "Ops",             align: "right" },
                          { h: "Comis. normal",   align: "right" },
                          { h: "SENEBI",          align: "right" },
                          { h: "Bruto",           align: "right" },
                          { h: `IIBB ${iibbPct}%`, align: "right" },
                          { h: "Neto",            align: "right" },
                          { h: "A pagar",         align: "right" },
                          { h: "Retiene BYG",     align: "right" },
                        ].map(({ h, align }) => (
                          <th key={h} className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-${align} whitespace-nowrap`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {clienteResumenes.map((r, i) => (
                        <tr key={i} className="border-b border-slate-50 last:border-0 bg-white hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-800">{r.sujeto}</td>
                          <td className="px-4 py-3 text-right tabular-nums font-mono text-slate-500">{r.opsCount}</td>
                          <td className="px-4 py-3 text-right tabular-nums font-mono text-slate-600">
                            {r.comisionNormal > 0 ? `ARS ${fmt(r.comisionNormal)}` : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-mono">
                            {r.senebi > 0 ? <span className="text-violet-600 font-semibold">ARS {fmt(r.senebi)}</span> : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-mono font-bold text-slate-900">ARS {fmt(r.bruto)}</td>
                          <td className="px-4 py-3 text-right tabular-nums font-mono text-rose-500">− ARS {fmt(r.iibb)}</td>
                          <td className="px-4 py-3 text-right tabular-nums font-mono font-bold text-blue-700">ARS {fmt(r.neto)}</td>
                          <td className="px-4 py-3 text-right tabular-nums font-mono">
                            {r.aPagar > 0 ? <span className="text-emerald-700 font-semibold">ARS {fmt(r.aPagar)}</span> : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-mono font-bold text-slate-900">ARS {fmt(r.retiene)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 bg-slate-50">
                        <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Total</td>
                        <td className="px-4 py-3 text-right tabular-nums font-mono font-bold text-slate-500">{reportOps.length}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-mono font-bold text-slate-700">ARS {fmt(rTotalNormal)}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-mono font-bold text-violet-600">{rSenebi > 0 ? `ARS ${fmt(rSenebi)}` : "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-mono font-black text-slate-900">ARS {fmt(rBruto)}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-mono font-bold text-rose-500">− ARS {fmt(rIibb)}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-mono font-black text-blue-700">ARS {fmt(rNeto)}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-mono font-bold text-emerald-700">{rAPagar > 0 ? `ARS ${fmt(rAPagar)}` : "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-mono font-black text-slate-900">ARS {fmt(rRetiene)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Reporte 3 — Detalle operaciones ─────────────────────────── */}
          {reportOps.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Detalle de operaciones</h2>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[1000px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        {[
                          { h: "Fecha concert.", align: "left"  },
                          { h: "Cliente",        align: "left"  },
                          { h: "Tipo",           align: "left"  },
                          { h: "Ticker",         align: "left"  },
                          { h: "Cantidad",       align: "right" },
                          { h: "Precio",         align: "right" },
                          { h: "Comis. normal",  align: "right" },
                          { h: "SENEBI",         align: "right" },
                          { h: "Bruto",          align: "right" },
                          { h: "Estado",         align: "left"  },
                          { h: "Ver",            align: "left"  },
                        ].map(({ h, align }, i) => (
                          <th key={h || `col-${i}`} className={`px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap text-${align}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportOps.map((op) => {
                        const gen     = comGenReport(op);
                        const comNorm = op.esSenebi ? 0 : gen;
                        const senebi  = op.esSenebi ? gen : 0;
                        return (
                          <tr key={op.id} className="border-b border-slate-50 last:border-0 bg-white hover:bg-slate-50/60 transition-colors">
                            <td className="px-3 py-3 font-mono text-slate-500 whitespace-nowrap">{fmtDate(op.fechaConcertacion)}</td>
                            <td className="px-3 py-3 font-medium text-slate-800 max-w-[150px] truncate">{op.sujeto}</td>
                            <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{TIPO_LABEL[op.tipoOperacion] ?? op.tipoOperacion}</td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-slate-900 tracking-tight">{op.ticker}</span>
                                {op.esSenebi && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 uppercase tracking-widest">SENEBI</span>}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums font-mono text-slate-600">{fmt(op.cantidad, 0)}</td>
                            <td className="px-3 py-3 text-right tabular-nums font-mono text-slate-600">{fmt(op.precio, 4)}</td>
                            <td className="px-3 py-3 text-right tabular-nums font-mono text-slate-600">
                              {comNorm > 0 ? `ARS ${fmt(comNorm)}` : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums font-mono">
                              {senebi > 0 ? <span className="text-violet-600 font-semibold">ARS {fmt(senebi)}</span> : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums font-mono font-bold text-slate-900">ARS {fmt(gen)}</td>
                            <td className="px-3 py-3">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${op.estado === "LIQUIDADA" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
                                {op.estado === "LIQUIDADA" ? "Liquidada" : "Concertada"}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <Link href={`/bolsa/${op.id}`} className="px-2 py-1 rounded-lg text-[10px] font-bold text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-colors whitespace-nowrap">
                                Ver →
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 bg-slate-50">
                        <td colSpan={8} className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Total</td>
                        <td className="px-3 py-3 text-right tabular-nums font-mono font-black text-slate-900">ARS {fmt(rBruto)}</td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

        </section>
      )}

    </div>
  );
}
