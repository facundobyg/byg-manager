import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CandlestickChart } from "lucide-react";
import { getOperacionBolsaById } from "@/lib/data/operacion-bolsa";
import { ConcertarForm } from "@/components/modules/bolsa/ConcertarForm";
import { AnularForm } from "@/components/modules/bolsa/AnularForm";

type PageProps = { params: Promise<{ id: string }> };

const TIPO_LABEL: Record<string, string> = {
  COMPRA_BONO:        "Compra Bono",
  VENTA_BONO:         "Venta Bono",
  COMPRA_ACCION:      "Compra Acción",
  VENTA_ACCION:       "Venta Acción",
  COMPRA_CEDEAR:      "Compra CEDEAR",
  VENTA_CEDEAR:       "Venta CEDEAR",
  CAUCION_COLOCADORA: "Caución Colocadora",
  CAUCION_TOMADORA:   "Caución Tomadora",
  FUTURO:             "Futuro",
  OPCION_CALL:        "Opción Call",
  OPCION_PUT:         "Opción Put",
  MEP:                "MEP",
  SENEBI:             "SENEBI",
};

const MERCADO_LABEL: Record<string, string> = {
  BYMA:        "BYMA",
  MAE:         "MAE",
  SENEBI_OTC:  "SENEBI OTC",
  MATBA_ROFEX: "MATBA-ROFEX",
  OTC:         "OTC",
};

const ESTADO_STYLE: Record<string, string> = {
  PENDIENTE_CONCERTACION: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
  CONCERTADA:             "bg-byg-accent/10 text-byg-accent ring-1 ring-byg-accent/20",
  LIQUIDADA:              "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
  ANULADA:                "bg-byg-surface-2 text-byg-muted",
};

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE_CONCERTACION: "Pendiente revisión",
  CONCERTADA:             "Concertada",
  LIQUIDADA:              "Liquidada",
  ANULADA:                "Anulada",
};

const LOG_ACCION_STYLE: Record<string, string> = {
  CARGA:        "bg-byg-surface-2 text-byg-muted",
  CONCERTACION: "bg-byg-accent/10 text-byg-accent",
  LIQUIDACION:  "bg-emerald-500/10 text-emerald-400",
  ANULACION:    "bg-rose-500/10 text-rose-400",
  EDICION:      "bg-violet-500/10 text-violet-400",
};

function fmt(n: number | null | undefined, decimals = 2) {
  if (n == null) return "—";
  return n.toLocaleString("es-AR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtDate(v: string | null | undefined) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString("es-AR", {
      day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC",
    });
  } catch { return "—"; }
}

function fmtDateTime(v: string) {
  try {
    return new Date(v).toLocaleString("es-AR", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
}

function InfoCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-byg-muted mb-0.5">{label}</p>
      <p className="text-[13px] font-semibold text-byg-text font-mono">{value}</p>
    </div>
  );
}

export default async function BolsaDetailPage({ params }: PageProps) {
  const { id } = await params;
  const op = await getOperacionBolsaById(id);
  if (!op) notFound();

  const sujeto    = op.ComitenteInversion?.nombre ?? op.Cliente?.nombre ?? op.Cartera?.nombre ?? "Cartera Propia";
  const tipoLabel = TIPO_LABEL[op.tipoOperacion] ?? op.tipoOperacion;

  const cantidad  = Number(op.cantidad);
  const precio    = Number(op.precio);
  const valorBruto = cantidad * precio;

  // Serialized for client components — use != null (not falsy) so 0 values survive
  const formDefaults = {
    nroBoleto:         op.nroBoleto,
    alyc:              op.alyc,
    fechaConcertacion: op.fechaConcertacion ? new Date(op.fechaConcertacion).toISOString().slice(0, 10) : null,
    fechaLiquidacion:  op.fechaLiquidacion  ? new Date(op.fechaLiquidacion).toISOString().slice(0, 10)  : null,
    comisionPct:       op.comisionPct       != null ? Number(op.comisionPct)       : null,
    comisionFija:      op.comisionFija      != null ? Number(op.comisionFija)      : null,
    derechosMercado:   op.derechosMercado   != null ? Number(op.derechosMercado)   : null,
    gastos:            op.gastos            != null ? Number(op.gastos)            : null,
    impuestos:         op.impuestos         != null ? Number(op.impuestos)         : null,
    tcMepDia:          op.tcMepDia          != null ? Number(op.tcMepDia)          : null,
    comisionUSD:       op.comisionUSD       != null ? Number(op.comisionUSD)       : null,
    esSenebi:          op.esSenebi,
    senebiBruto:       op.senebiBruto       != null ? Number(op.senebiBruto)       : null,
    diasCaucion:       op.diasCaucion,
    tasaCaucion:       op.tasaCaucion       != null ? Number(op.tasaCaucion)       : null,
  };

  const costoReal          = op.costoReal          != null ? Number(op.costoReal)          : null;
  const netoLiquidado      = op.netoLiquidado      != null ? Number(op.netoLiquidado)      : null;
  const precioPromedioReal = op.precioPromedioReal  != null ? Number(op.precioPromedioReal) : null;
  const resultadoBruto     = op.resultadoBruto     != null ? Number(op.resultadoBruto)     : null;
  const resultadoNeto      = op.resultadoNeto      != null ? Number(op.resultadoNeto)      : null;

  const canEditBoleto = op.estado === "PENDIENTE_CONCERTACION" || op.estado === "CONCERTADA";
  const canAnular     = !op.anulada;

  return (
    <div className="flex flex-col gap-8">

      {/* Breadcrumb */}
      <Link
        href="/bolsa"
        className="flex items-center gap-1 text-byg-muted hover:text-byg-accent text-[10px] font-black uppercase tracking-widest transition-colors group w-fit"
      >
        <ChevronLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
        Operaciones Bolsa
      </Link>

      {/* Header */}
      <header className="flex items-center gap-5 bg-byg-surface p-6 rounded-2xl border border-byg-border relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-byg-accent" />
        <div className="p-4 bg-byg-accent text-white rounded-2xl shrink-0">
          <CandlestickChart size={26} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-byg-accent uppercase tracking-widest mb-1">Operación Bolsa</p>
          <h1 className="text-3xl font-black text-byg-text tracking-tight">
            {op.ticker}
            <span className="text-byg-muted font-medium text-xl ml-3">{tipoLabel}</span>
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[11px] font-bold bg-byg-surface-2 text-byg-muted px-2 py-0.5 rounded-md border border-byg-border">{sujeto}</span>
            <span className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest ${ESTADO_STYLE[op.estado] ?? "bg-byg-surface-2 text-byg-muted"}`}>
              {ESTADO_LABEL[op.estado] ?? op.estado}
            </span>
            {op.anulada && (
              <span className="text-[9px] font-black px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20 uppercase tracking-widest">
                Anulada
              </span>
            )}
          </div>
        </div>
        <div className="text-right pl-6 border-l border-byg-border shrink-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-byg-muted mb-1">Valor Bruto</p>
          <p className="text-2xl font-black text-byg-text tabular-nums font-mono">{op.moneda} {fmt(valorBruto)}</p>
          <p className="text-[10px] text-byg-muted mt-0.5 font-mono">
            {fmt(cantidad, 0)} × {fmt(precio, 4)}
          </p>
        </div>
      </header>

      {/* Banner alerta — pendiente revisión */}
      {op.estado === "PENDIENTE_CONCERTACION" && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
          <div className="w-2 h-2 mt-1.5 rounded-full bg-amber-400 shrink-0" />
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-amber-400">
              Pendiente de revisión
            </p>
            <p className="text-[12px] text-byg-muted mt-0.5">
              Cargar boleto y comisiones reales para concertar la operación.
            </p>
          </div>
        </div>
      )}

      {/* Resumen de carga — datos estimados */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-byg-muted">
          Carga estimada · {op.OperadorCarga.name}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-byg-surface rounded-xl border border-byg-border p-4 flex flex-col gap-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-byg-muted">Tipo</p>
            <p className="text-[13px] font-black text-byg-text">{tipoLabel}</p>
          </div>
          <div className="bg-byg-surface rounded-xl border border-byg-border p-4 flex flex-col gap-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-byg-muted">Mercado</p>
            <p className="text-[13px] font-black text-byg-text">{MERCADO_LABEL[op.mercado] ?? op.mercado}</p>
          </div>
          <div className="bg-byg-surface rounded-xl border border-byg-border p-4 flex flex-col gap-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-byg-muted">Fecha operativa</p>
            <p className="text-[13px] font-black text-byg-text font-mono">
              {op.fechaOperativa ? fmtDate(op.fechaOperativa.toISOString()) : "—"}
            </p>
          </div>
          <div className="bg-byg-surface rounded-xl border border-byg-border p-4 flex flex-col gap-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-byg-muted">Cargada</p>
            <p className="text-[13px] font-semibold text-byg-text">{fmtDateTime(op.fechaCarga.toISOString())}</p>
          </div>
          {op.resultadoBruto != null && (
            <div className="bg-byg-surface rounded-xl border border-byg-border p-4 flex flex-col gap-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-byg-muted">Resultado est.</p>
              <p className="text-[13px] font-semibold font-mono text-byg-text">
                {op.moneda} {fmt(Number(op.resultadoBruto))}
              </p>
            </div>
          )}
        </div>
        {op.observaciones && (
          <div className="bg-byg-surface-2 rounded-xl border border-byg-border px-5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-byg-muted mb-1">Observaciones</p>
            <p className="text-[12px] text-byg-text">{op.observaciones}</p>
          </div>
        )}
      </section>

      {/* Concertada por — solo cuando ya fue concertada */}
      {op.OperadorCierre && (
        <div className="flex items-center gap-4 text-[11px] text-byg-muted">
          <span>Concertada por <strong className="text-byg-text">{op.OperadorCierre.name}</strong></span>
          <span>{fmtDate(formDefaults.fechaConcertacion)}</span>
        </div>
      )}

      {/* Resultados reales — solo si concertada/liquidada */}
      {costoReal != null && (
        <section className="bg-byg-surface rounded-2xl border border-byg-border overflow-hidden">
          <div className="px-6 py-4 border-b border-byg-border">
            <h2 className="text-[12px] font-bold uppercase tracking-widest text-byg-text">Resultados reales</h2>
          </div>
          <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-3 gap-6">
            <InfoCell label="Valor Bruto"       value={`${op.moneda} ${fmt(valorBruto)}`} />
            <InfoCell label="Costo Real"         value={`${op.moneda} ${fmt(costoReal)}`} />
            <InfoCell label="Neto Liquidado"     value={netoLiquidado      != null ? `${op.moneda} ${fmt(netoLiquidado)}`            : "—"} />
            <InfoCell label="Precio Prom. Real"  value={precioPromedioReal != null ? fmt(precioPromedioReal, 4)                      : "—"} />
            <InfoCell label="Resultado Bruto"    value={resultadoBruto     != null ? `${op.moneda} ${fmt(resultadoBruto)}`           : "—"} />
            <InfoCell label="Resultado Neto"     value={resultadoNeto      != null ? `${op.moneda} ${fmt(resultadoNeto)}`            : "—"} />
          </div>
          {op.nroBoleto && (
            <div className="px-6 pb-4 flex items-center gap-4 text-[11px] text-byg-muted">
              <span>Boleto: <strong className="text-byg-text">{op.nroBoleto}</strong></span>
              {op.alyc && <span>ALYC: <strong className="text-byg-text">{op.alyc}</strong></span>}
              {formDefaults.fechaLiquidacion && <span>Liquidación: <strong className="text-byg-text">{fmtDate(formDefaults.fechaLiquidacion)}</strong></span>}
            </div>
          )}
          {op.motivoAnulacion && (
            <div className="px-6 pb-4">
              <p className="text-[11px] text-rose-400 font-semibold">Anulada: {op.motivoAnulacion}</p>
            </div>
          )}
        </section>
      )}

      {/* Revisión — datos reales */}
      {canEditBoleto && (
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-byg-muted -mb-4">
          Revisión · datos reales
        </p>
      )}
      {canEditBoleto && (
        <ConcertarForm
          operacionId={op.id}
          estado={op.estado}
          tipoOperacion={op.tipoOperacion}
          {...formDefaults}
        />
      )}

      {/* Motivo anulación (si no hay costoReal y está anulada) */}
      {op.anulada && op.motivoAnulacion && costoReal == null && (
        <div className="bg-rose-500/10 rounded-xl border border-rose-500/20 px-5 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-1">Motivo de anulación</p>
          <p className="text-[12px] text-rose-300">{op.motivoAnulacion}</p>
        </div>
      )}

      {/* Anular */}
      {canAnular && (
        <div className="flex justify-end">
          <AnularForm operacionId={op.id} />
        </div>
      )}

      {/* Audit log */}
      <section className="bg-byg-surface rounded-2xl border border-byg-border overflow-hidden">
        <div className="px-6 py-4 border-b border-byg-border">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-byg-text">
            Trazabilidad — {op.OperacionBolsaLog.length} eventos
          </h2>
        </div>
        {op.OperacionBolsaLog.length === 0 ? (
          <p className="px-6 py-4 text-xs text-byg-muted italic">Sin eventos.</p>
        ) : (
          <div className="divide-y divide-byg-border/40">
            {op.OperacionBolsaLog.map((log) => (
              <div key={log.id} className="px-6 py-3 flex items-center gap-4">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${LOG_ACCION_STYLE[log.accion] ?? "bg-byg-surface-2 text-byg-muted"}`}>
                  {log.accion}
                </span>
                <span className="text-[11px] text-byg-muted whitespace-nowrap font-mono">
                  {fmtDateTime(log.createdAt.toISOString())}
                </span>
                {log.User && (
                  <span className="text-[11px] font-semibold text-byg-text">{log.User.name}</span>
                )}
                {log.estadoAnterior && (
                  <span className="text-[10px] text-byg-muted">
                    {log.estadoAnterior.replace("_", " ")} → {log.estadoNuevo.replace("_", " ")}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
