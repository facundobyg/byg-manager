"use client";

import { useState, useMemo, useActionState, useEffect, Fragment } from "react";
import Link from "next/link";
import type { MovDiarioRow, TipoMovDiario, EstadoMovDiario } from "@/lib/data/mov-diarios-utils";
import { agruparPorCliente, normalizarNombreCliente } from "@/lib/data/mov-diarios-utils";
import { Trash2, Activity, Plus, User, X, RotateCcw } from "lucide-react";
import {
  liquidarPagoPendiente,
  eliminarMovimientoCaja,
  cancelarOperacionCambioPendiente,
  editarMovimientoCajaCompleto,
  editarOperacionCambio,
  revertirOperacionCambio,
} from "@/app/(dashboard)/operativa/mov-diarios/actions";
import { Edit2, Settings } from "lucide-react";

function formatMoney(n: number | undefined, moneda: string = "USD") {
  if (n === undefined || n === null) return "—";
  const absN = Math.abs(n);
  const formatted = absN.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const prefix = moneda === "ARS" ? "$" : (moneda === "USD" ? "USD" : moneda);
  const sign = n < 0 ? "-" : "";
  return `${sign}${prefix} ${formatted}`;
}

function fmtFechaHeader(d: string | Date) {
  const options: Intl.DateTimeFormatOptions = { weekday: "short", day: "2-digit", month: "short" };
  const dateStr = new Date(d).toLocaleDateString("es-AR", { ...options, timeZone: "UTC" }).toUpperCase();
  const fullDate = new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
  return `${dateStr} — ${fullDate}`;
}

type EstadoBadge = { label: string; moneda: string; cls: string };

function estadoDeuda(totalUSD: number, totalARS: number): EstadoBadge[] {
  const badges: EstadoBadge[] = [];
  if (totalUSD !== 0) badges.push({
    label: totalUSD > 0 ? "Cliente debe" : "BYG debe",
    moneda: "USD",
    cls: totalUSD > 0
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  });
  if (totalARS !== 0) badges.push({
    label: totalARS > 0 ? "Cliente debe" : "BYG debe",
    moneda: "ARS",
    cls: totalARS > 0
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  });
  if (badges.length === 0) {
    return [{ label: "Compensado", moneda: "", cls: "bg-byg-surface-2 text-byg-muted border-byg-border" }];
  }
  return badges;
}

function getRowPriority(row: MovDiarioRow) {
  const type = row.subTipo || row.tipo;
  if (type === "COMPRA_USD") return 1;
  if (type === "VENTA_USD") return 2;
  if (type === "COMPRA_EUR") return 3;
  if (type === "VENTA_EUR") return 4;
  if (type === "COMPRA_BRL") return 5;
  if (type === "VENTA_BRL") return 6;
  if (["COMISION", "HONORARIO_CLIENTE", "HONORARIO_EXTERNO", "RESULTADO"].includes(type)) return 7;
  if (row.clasificacionOperativa === "MOVIMIENTO_CAJA") return 8;
  if (type === "AJUSTE") return 9;
  return 10;
}

type CajaOpt = { id: string; label: string; slug?: string };

function LiquidarPagoModal({ operaciones, cajas, clienteNombre }: {
  operaciones: MovDiarioRow[];
  cajas: CajaOpt[];
  clienteNombre: string;
}) {
  const [open, setOpen] = useState(false);
  const [modo, setModo] = useState<"total" | "parcial">("total");
  const [state, action, pending] = useActionState(liquidarPagoPendiente, null);

  const cambioOps = operaciones.filter(op => op.clasificacionOperativa === "CAMBIO");
  const operativeCajas = cajas.filter(c =>
    (c as any).tipo === "CENTRAL_CONTABLE" || (c as any).tipo === "SUCURSAL_OPERATIVA" ||
    !(c as any).tipo
  );

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state?.ok]);

  if (cambioOps.length === 0) {
    return <span className="text-[10px] text-byg-muted font-bold uppercase">Sin cambios</span>;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-byg-accent text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
      >
        <Plus size={12} /> Sumar Pago
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-byg-bg/70 backdrop-blur-[12px]"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-byg-surface rounded-2xl shadow-2xl w-full max-w-2xl border border-byg-border max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-byg-border shrink-0">
              <div>
                <h3 className="text-sm font-black text-byg-text uppercase tracking-widest">Liquidar Pago</h3>
                <p className="text-[10px] text-byg-muted mt-0.5">
                  {clienteNombre} · {cambioOps.length} op{cambioOps.length !== 1 ? "s" : ""} pendiente{cambioOps.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-byg-surface-2 transition-colors">
                <X size={16} className="text-byg-muted hover:text-byg-text" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex flex-col gap-5">
              {/* Ops summary */}
              <div className="flex flex-col gap-2">
                {cambioOps.map(op => (
                  <div key={op.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-byg-bg border border-byg-border flex-wrap">
                    <span className="text-[10px] font-black uppercase text-byg-muted shrink-0">{op.subTipo?.replace(/_/g, " ") || op.tipo}</span>
                    <span className="text-sm font-black tabular-nums font-mono text-byg-text">{formatMoney(op.monto, op.moneda)}</span>
                    {op.tc !== undefined && <span className="text-[10px] text-byg-muted">TC {op.tc.toLocaleString("es-AR")}</span>}
                    {op.totalARS !== undefined && (
                      <span className="text-[10px] font-bold tabular-nums font-mono text-rose-500 ml-auto">{formatMoney(op.totalARS, "ARS")}</span>
                    )}
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                      op.estado === "PARCIAL"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    }`}>{op.estado === "PARCIAL" ? "PARCIAL" : "PEND."}</span>
                  </div>
                ))}
              </div>

              <form action={action} className="flex flex-col gap-5">
                {cambioOps.map(op => (
                  <input key={op.id} type="hidden" name="operacionId" value={op.id} />
                ))}
                <input type="hidden" name="modo" value={modo} />

                {/* Mode toggle */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted mb-2">Modo de liquidación</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setModo("total")}
                      className={`flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                        modo === "total"
                          ? "bg-byg-accent/20 text-byg-accent border-byg-accent/40"
                          : "border-byg-border text-byg-muted hover:bg-byg-surface-2"
                      }`}>
                      Total
                    </button>
                    <button type="button" onClick={() => setModo("parcial")}
                      className={`flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                        modo === "parcial"
                          ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40"
                          : "border-byg-border text-byg-muted hover:bg-byg-surface-2"
                      }`}>
                      Parcial
                    </button>
                  </div>
                </div>

                {/* Total: caja selector */}
                {modo === "total" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Caja de liquidación</label>
                    <select name="cajaId" required
                      className="bg-byg-bg border border-byg-border rounded-xl px-3 py-2.5 text-sm font-bold text-byg-text focus:outline-none focus:ring-1 focus:ring-byg-accent/40">
                      <option value="">Seleccionar caja...</option>
                      {operativeCajas.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                )}

                {/* Parcial: per-caja grid */}
                {modo === "parcial" && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Distribuir en cajas</p>
                    <div className="rounded-xl border border-byg-border overflow-hidden">
                      <div className="grid grid-cols-3 bg-byg-bg border-b border-byg-border">
                        <div className="px-3 py-2 text-[8px] font-black uppercase tracking-widest text-byg-muted">Caja</div>
                        <div className="px-3 py-2 text-[8px] font-black uppercase tracking-widest text-byg-muted text-right">Divisa</div>
                        <div className="px-3 py-2 text-[8px] font-black uppercase tracking-widest text-byg-muted text-right">ARS</div>
                      </div>
                      {operativeCajas.map(c => (
                        <div key={c.id} className="grid grid-cols-3 border-b border-byg-border/50 last:border-0">
                          <div className="px-3 py-2.5 flex items-center">
                            <span className="text-[11px] font-bold text-byg-text">{c.label}</span>
                          </div>
                          <div className="px-2 py-1.5">
                            <input type="number" name={`caja_${c.id}_div`} step="0.01" min="0" placeholder="0"
                              className="w-full bg-byg-bg border border-byg-border rounded-lg px-2 py-1.5 text-sm font-mono text-byg-text focus:outline-none focus:ring-1 focus:ring-byg-accent/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none text-right" />
                          </div>
                          <div className="px-2 py-1.5">
                            <input type="number" name={`caja_${c.id}_ars`} step="1" min="0" placeholder="0"
                              className="w-full bg-byg-bg border border-byg-border rounded-lg px-2 py-1.5 text-sm font-mono text-byg-text focus:outline-none focus:ring-1 focus:ring-amber-500/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none text-right" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[9px] text-byg-muted">Campos vacíos = caja no participa. ARS se calcula automáticamente si se omite.</p>
                  </div>
                )}

                <button type="submit" disabled={pending}
                  className="w-full py-3 rounded-xl bg-byg-accent text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all disabled:opacity-50">
                  {pending ? "Procesando..." : modo === "total" ? "Confirmar Liquidación Total" : "Confirmar Pago Parcial"}
                </button>

                {state?.error && (
                  <p className="text-[11px] font-black uppercase text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 text-center">
                    ⚠️ {state.error}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DeleteMovButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(eliminarMovimientoCaja, null);
  const [confirmed, setConfirmed] = useState(false);

  if (state?.ok) {
    return <span className="text-[9px] text-byg-muted font-bold uppercase">Eliminado</span>;
  }

  if (!confirmed) {
    return (
      <button
        onClick={() => setConfirmed(true)}
        title="Eliminar movimiento"
        className="p-2 text-byg-muted hover:text-red-400 transition-colors"
      >
        <Trash2 size={14} />
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-1 items-center">
      <input type="hidden" name="id" value={id} />
      <div className="flex items-center gap-1">
        <button
          type="submit"
          disabled={pending}
          className="text-[9px] font-black uppercase text-rose-700 dark:text-rose-400 px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-50 transition-colors"
        >
          {pending ? "..." : "Eliminar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmed(false)}
          className="text-[9px] font-black uppercase text-byg-muted px-2 py-1 rounded hover:bg-byg-surface-2 transition-colors"
        >
          <X size={10} />
        </button>
      </div>
      {state?.error && <span className="text-[9px] text-red-500 text-center max-w-[80px]">{state.error}</span>}
    </form>
  );
}


function EditMovButton({ row }: { row: MovDiarioRow }) {
  const [state, action, pending] = useActionState(editarMovimientoCajaCompleto, null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (state?.ok) {
      const t = setTimeout(() => setIsEditing(false), 600);
      return () => clearTimeout(t);
    }
  }, [state?.ok]);

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        title="Editar movimiento completo"
        className="flex items-center gap-1 p-2 text-byg-muted hover:text-byg-accent transition-all font-bold text-[10px]"
      >
        <Edit2 size={14} /> <span className="uppercase">Editar</span>
      </button>
    );
  }

  const dateStr = typeof row.fecha === "string" ? row.fecha : row.fecha.toISOString();

  return (
    <div className="fixed inset-0 bg-byg-bg/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-byg-surface rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-byg-border">
        <div className="px-6 py-4 border-b border-byg-border flex items-center justify-between bg-byg-bg">
          <h3 className="text-sm font-black text-byg-text uppercase tracking-widest">Editar Movimiento</h3>
          <button onClick={() => setIsEditing(false)} className="p-2 text-byg-muted hover:text-byg-text">
            <X size={20} />
          </button>
        </div>
        <form action={action} className="p-6 flex flex-col gap-4">
          <input type="hidden" name="id" value={row.id} />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-byg-muted uppercase ml-1">Fecha</label>
              <input type="date" name="fecha" defaultValue={dateStr.split("T")[0]} required className="border border-byg-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-byg-bg text-byg-text" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-byg-muted uppercase ml-1">Tipo</label>
              <select name="tipo" defaultValue={row.tipo} className="border border-byg-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-byg-bg text-byg-text">
                <option value="ENTRADA">ENTRADA</option>
                <option value="SALIDA">SALIDA</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-byg-muted uppercase ml-1">Moneda</label>
              <select name="moneda" defaultValue={row.moneda} className="border border-byg-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-byg-bg text-byg-text">
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
                <option value="EUR">EUR</option>
                <option value="BRL">BRL</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-byg-muted uppercase ml-1">Monto</label>
              <input type="text" name="monto" defaultValue={row.monto} required className="border border-byg-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none font-mono tabular-nums bg-byg-bg text-byg-text" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-byg-muted uppercase ml-1">Descripción</label>
            <textarea name="descripcion" defaultValue={row.descripcion || ""} className="border border-byg-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none h-20 resize-none bg-byg-bg text-byg-text" />
          </div>

          {state?.error && <p className="text-[10px] font-bold text-red-500 text-center">{state.error}</p>}
          {state?.ok && <p className="text-[10px] font-bold text-emerald-500 text-center">¡Actualizado!</p>}

          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest text-byg-muted bg-byg-surface-2 hover:bg-byg-border transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {pending ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditCambioButton({ row }: { row: MovDiarioRow }) {
  const [state, action, pending] = useActionState(editarOperacionCambio, null);
  const [isEditing, setIsEditing] = useState(false);
  const isPendiente = row.estado === "PENDIENTE";
  const currentTipoOp = row.subTipo?.startsWith("COMPRA") ? "COMPRA" : "VENTA";

  useEffect(() => {
    if (state?.ok) {
      const t = setTimeout(() => setIsEditing(false), 600);
      return () => clearTimeout(t);
    }
  }, [state?.ok]);

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        title="Editar operación de cambio"
        className="flex items-center gap-1 p-2 text-byg-muted hover:text-byg-accent transition-all font-bold text-[10px]"
      >
        <Edit2 size={14} /> <span className="uppercase">Editar</span>
      </button>
    );
  }

  const dateStr = typeof row.fecha === "string" ? row.fecha : row.fecha.toISOString();

  return (
    <div className="fixed inset-0 bg-byg-bg/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-byg-surface rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-byg-border">
        <div className="px-6 py-4 border-b border-byg-border flex items-center justify-between bg-byg-bg">
          <h3 className="text-sm font-black text-byg-text uppercase tracking-widest">Editar Operación Cambio</h3>
          <button onClick={() => setIsEditing(false)} className="p-2 text-byg-muted hover:text-byg-text"><X size={20} /></button>
        </div>
        <form action={action} className="p-6 flex flex-col gap-4">
          <input type="hidden" name="id" value={row.id} />
          {!isPendiente && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 rounded-lg px-3 py-2">
              Edición limitada: solo cliente y descripción. Usá "Revertir" para modificar monto/TC.
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-[10px] font-black text-byg-muted uppercase ml-1">Cliente</label>
              <input type="text" name="clienteNombre" defaultValue={row.cliente !== "—" ? row.cliente : ""} className="border border-byg-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-byg-bg text-byg-text" />
            </div>
          </div>
          {isPendiente && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-byg-muted uppercase ml-1">Tipo Op.</label>
                <select name="tipoOp" defaultValue={currentTipoOp} className="border border-byg-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-byg-bg text-byg-text font-bold">
                  <option value="COMPRA">COMPRA</option>
                  <option value="VENTA">VENTA</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-byg-muted uppercase ml-1">Estado</label>
                <select name="estadoNuevo" defaultValue="PENDIENTE" className="border border-byg-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-byg-bg text-byg-text font-bold">
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="COBRADA">Liquidar (Cobrada)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-byg-muted uppercase ml-1">Fecha</label>
                <input type="date" name="fecha" defaultValue={dateStr.split("T")[0]} className="border border-byg-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-byg-bg text-byg-text" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-byg-muted uppercase ml-1">Moneda</label>
                <select name="moneda" defaultValue={row.moneda} className="border border-byg-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-byg-bg text-byg-text font-bold">
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="BRL">BRL</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-byg-muted uppercase ml-1">Cantidad</label>
                <input type="number" name="cantidad" defaultValue={row.monto || ""} step="any" min="0.01" className="border border-byg-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none font-mono bg-byg-bg text-byg-text" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-byg-muted uppercase ml-1">Tipo de Cambio</label>
                <input type="number" name="tipoCambio" defaultValue={row.tc || ""} step="any" min="0.01" className="border border-byg-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none font-mono bg-byg-bg text-byg-text" />
              </div>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-byg-muted uppercase ml-1">Descripción</label>
            <textarea name="descripcion" defaultValue={row.descripcion || ""} className="border border-byg-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none h-16 resize-none bg-byg-bg text-byg-text" />
          </div>
          {state?.error && <p className="text-[10px] font-bold text-red-500 text-center">{state.error}</p>}
          {state?.ok && <p className="text-[10px] font-bold text-emerald-500 text-center">¡Actualizado!</p>}
          <div className="flex items-center gap-3 mt-2">
            <button type="button" onClick={() => setIsEditing(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest text-byg-muted bg-byg-surface-2 hover:bg-byg-border transition-all">Cancelar</button>
            <button type="submit" disabled={pending} className="flex-1 px-4 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50">
              {pending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CancelarPendienteButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(cancelarOperacionCambioPendiente, null);
  const [confirmed, setConfirmed] = useState(false);

  if (state?.ok) {
    return <span className="text-[9px] text-byg-muted font-bold uppercase">Cancelada</span>;
  }

  if (!confirmed) {
    return (
      <button
        onClick={() => setConfirmed(true)}
        className="text-[9px] font-black uppercase text-rose-700 dark:text-rose-400 px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
      >
        Cancelar
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-1 items-center">
      <input type="hidden" name="id" value={id} />
      <div className="flex items-center gap-1">
        <button
          type="submit"
          disabled={pending}
          className="text-[9px] font-black uppercase text-rose-700 dark:text-rose-400 px-2 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 disabled:opacity-50 transition-colors"
        >
          {pending ? "..." : "Confirmar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmed(false)}
          className="text-[9px] font-black uppercase text-byg-muted px-2 py-1 rounded hover:bg-byg-surface-2 transition-colors"
        >
          <X size={10} />
        </button>
      </div>
      {state?.error && <span className="text-[9px] text-red-500 text-center max-w-[80px]">{state.error}</span>}
    </form>
  );
}

function RevertirButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(revertirOperacionCambio, null);
  const [confirmed, setConfirmed] = useState(false);

  if (state?.ok) {
    return (
      <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded bg-emerald-500/10">
        Revertida — edite y liquide
      </span>
    );
  }

  if (!confirmed) {
    return (
      <button
        onClick={() => setConfirmed(true)}
        title="Revertir y recrear operación"
        className="flex items-center gap-1 p-2 text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-colors font-bold text-[10px]"
      >
        <RotateCcw size={13} /> <span className="uppercase">Revertir</span>
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-1 items-center">
      <input type="hidden" name="id" value={id} />
      <div className="flex items-center gap-1">
        <span className="text-[8px] text-amber-600 dark:text-amber-400 font-black uppercase">¿Confirmar?</span>
        <button
          type="submit"
          disabled={pending}
          className="text-[9px] font-black uppercase text-amber-700 dark:text-amber-400 px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-50 transition-colors"
        >
          {pending ? "..." : "Sí"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmed(false)}
          className="text-[9px] font-black uppercase text-byg-muted px-2 py-1 rounded hover:bg-byg-surface-2 transition-colors"
        >
          <X size={10} />
        </button>
      </div>
      {state?.error && <span className="text-[9px] text-red-500 text-center max-w-[120px]">{state.error}</span>}
    </form>
  );
}

type Props = {
  rows: MovDiarioRow[];
  resultadoCambio?: {
    USD: { netoDivisa: number; netoARS: number; resultado: number };
    EUR: { netoDivisa: number; netoARS: number; resultado: number };
    BRL: { netoDivisa: number; netoARS: number; resultado: number };
    totalUSD: number;
    tcBlue: number;
  };
  children?: React.ReactNode;
  cajas?: any[];
  title?: string;
  activeCajaId?: string;
  canWrite?: boolean;
};

export function MovDiariosTable({ rows, resultadoCambio, children, cajas, title, activeCajaId, canWrite = true }: Props) {
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<TipoMovDiario | "">("");
  const [filtroEstado, setFiltroEstado] = useState<EstadoMovDiario | "">("");
  const [showMovCaja, setShowMovCaja] = useState(false);
  const diasUnicos = useMemo(() => {
    const set = new Set(rows.map(r => new Date(r.fecha).toISOString().split("T")[0]));
    const all = Array.from(set).sort((a, b) => b.localeCompare(a));
    if (all.length === 0) return all;
    const currentMonth = all[0].slice(0, 7); // "YYYY-MM" of most recent entry
    return all.filter(d => d.startsWith(currentMonth));
  }, [rows]);

  const [selectedDay, setSelectedDay] = useState<string>(diasUnicos[0] || "");

  const clientes = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    rows.forEach((r) => {
      if (r.cliente === "—") return;
      const norm = normalizarNombreCliente(r.cliente);
      if (!seen.has(norm)) { seen.add(norm); result.push(r.cliente); }
    });
    return result.sort();
  }, [rows]);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const day = new Date(r.fecha).toISOString().split("T")[0];
        if (selectedDay && day !== selectedDay) return false;
        if (filtroCliente && normalizarNombreCliente(r.cliente) !== normalizarNombreCliente(filtroCliente)) return false;
        if (filtroTipo && r.tipo !== filtroTipo) return false;
        if (filtroEstado && r.estado !== filtroEstado) return false;
        return true;
      }),
    [rows, selectedDay, filtroCliente, filtroTipo, filtroEstado]
  );

  // Consolidación visual por cliente/día/tipo/moneda
  const consolidated = useMemo(() => {
    const dayMap = new Map<string, MovDiarioRow[]>();

    filtered.forEach(r => {
      const day = new Date(r.fecha).toISOString().split("T")[0];
      if (!dayMap.has(day)) dayMap.set(day, []);
      dayMap.get(day)!.push(r);
    });

    const result = new Map<string, MovDiarioRow[]>();

    dayMap.forEach((dayRows, day) => {
      const clientGroups = new Map<string, MovDiarioRow[]>();

      dayRows.forEach(r => {
        const isManual = r.clasificacionOperativa === "MOVIMIENTO_CAJA";
        const key = isManual ? `manual-${r.id}` : `${normalizarNombreCliente(r.cliente)}-${r.subTipo || r.tipo}-${r.moneda}-${r.estado}`;

        if (!clientGroups.has(key)) clientGroups.set(key, []);
        clientGroups.get(key)!.push(r);
      });

      const dayConsolidated: MovDiarioRow[] = [];
      clientGroups.forEach(group => {
        if (group.length === 1) {
          dayConsolidated.push(group[0]);
        } else {
          const first = group[0];
          const totalMonto = group.reduce((acc, r) => acc + (r.monto || 0), 0);
          const totalARSVal = group.reduce((acc, r) => acc + (r.totalARS || 0), 0);
          const avgTC = totalMonto > 0 ? totalARSVal / totalMonto : first.tc;

          dayConsolidated.push({
            ...first,
            id: `consolidated-${first.id}`,
            monto: totalMonto,
            totalARS: totalARSVal,
            tc: avgTC,
            isConsolidated: true,
            rowCount: group.length
          } as any);
        }
      });

      dayConsolidated.sort((a, b) => getRowPriority(a) - getRowPriority(b));

      // Attach children to consolidated rows for B3 expand/collapse
      const withChildren = dayConsolidated.map((r) => {
        if ((r as any).isConsolidated) {
          const key = r.id.replace("consolidated-", "");
          const origGroup = Array.from(clientGroups.values()).find(
            (g) => g.length > 1 && g[0].id === key
          );
          return { ...r, children: origGroup ?? [] };
        }
        return r;
      });

      result.set(day, withChildren);
    });

    return result;
  }, [filtered]);

  const totalPendienteUSD = useMemo(
    () => filtered.filter((r) => r.estado === "PENDIENTE" && r.moneda === "USD")
      .reduce((acc, r) => acc + (r.monto || 0), 0),
    [filtered]
  );

  const totalPendienteARS = useMemo(
    () => filtered.filter((r) => r.estado === "PENDIENTE" && r.moneda === "ARS")
      .reduce((acc, r) => acc + (r.monto || 0), 0),
    [filtered]
  );

  const saldadasGroups = useMemo(() => {
    const map = new Map<string, MovDiarioRow[]>();
    consolidated.forEach((dayRows, day) => {
      const filteredDay = dayRows.filter(r => {
        if (r.estado === "REVERTIDA") return false;
        if (!showMovCaja && r.clasificacionOperativa === "MOVIMIENTO_CAJA") return false;
        return true;
      });
      if (filteredDay.length > 0) map.set(day, filteredDay);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [consolidated, showMovCaja]);

  const deudaPorCliente = useMemo(() => {
    const pendientes = filtered.filter(r => r.estado === "PENDIENTE" || r.estado === "PARCIAL");
    return Object.values(agruparPorCliente(pendientes)).sort((a, b) => a.cliente.localeCompare(b.cliente));
  }, [filtered]);

  const [expandedDeuda, setExpandedDeuda] = useState<Set<string>>(new Set());
  const toggleDeuda = (cliente: string) =>
    setExpandedDeuda((prev) => {
      const next = new Set(prev);
      next.has(cliente) ? next.delete(cliente) : next.add(cliente);
      return next;
    });

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const toggleGroup = (id: string) =>
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // B4: Pendientes operativos — subtipos de obligación visible en sección aparte
  const OBLIGATION_SUBTYPES = new Set([
    "GUARDA_CLIENTE", "DEVOLUCION_GUARDA_CLIENTE",
    "PRESTAMO_TEMPORAL", "PRESTAMO_CLIENTE", "DEVOLUCION_PRESTAMO",
    "ADELANTO_FUTURA_OP", "DIFERENCIA_LIQUIDACION",
    "INGRESO_CC_CLIENTE", "EGRESO_CC_CLIENTE",
    "INGRESO_PF_CLIENTE", "EGRESO_PF_CLIENTE",
  ]);

  const pendientesOp = useMemo(
    () => rows
      .filter((r) =>
        r.clasificacionOperativa === "MOVIMIENTO_CAJA" &&
        OBLIGATION_SUBTYPES.has(r.subtipoOperativo ?? "")
      )
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows]
  );

  const anyActive = selectedDay || filtroCliente || filtroTipo || filtroEstado;

  const totalCajasUSD = cajas?.reduce((acc, c) => acc + c.saldoUSD, 0) ?? 0;
  const totalCajasARS = cajas?.reduce((acc, c) => acc + c.saldoARS, 0) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {title && (
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-byg-text tracking-tight">{title}</h1>
        </header>
      )}

      {/* 1. Summary cards — always 4 in one row on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 1 — Caja Seleccionada */}
        <div className="bg-byg-surface rounded-2xl border border-byg-border border-l-[5px] border-l-blue-600 p-5 flex flex-col gap-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-byg-muted">
            {cajas?.find(c => activeCajaId ? c.id === activeCajaId : c.esPrincipal)?.label || "Caja Principal"}
          </p>
          <p className="text-xl font-black text-byg-text tabular-nums font-mono tracking-tighter truncate">
            {formatMoney(cajas?.find(c => activeCajaId ? c.id === activeCajaId : c.esPrincipal)?.saldoUSD ?? 0, "USD")}
          </p>
          <p className="text-xs font-bold text-byg-muted tabular-nums font-mono truncate">
            {formatMoney(cajas?.find(c => activeCajaId ? c.id === activeCajaId : c.esPrincipal)?.saldoARS ?? 0, "ARS")}
          </p>
        </div>

        {/* 2 — Pendiente Hoy */}
        <div className="bg-byg-surface rounded-2xl border border-byg-border border-l-[5px] border-l-amber-500 p-5 flex flex-col gap-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-byg-muted">Pendiente Hoy</p>
          <p className="text-xl font-black text-byg-text tabular-nums font-mono tracking-tighter truncate">
            {formatMoney(totalPendienteUSD, "USD")}
          </p>
          <p className="text-xs font-bold text-byg-muted tabular-nums font-mono truncate">
            {formatMoney(totalPendienteARS, "ARS")}
          </p>
        </div>

        {/* 3 — Total de Cajas */}
        <div className="bg-byg-surface rounded-2xl border border-byg-border border-l-[5px] border-l-byg-border-2 p-5 flex flex-col gap-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-byg-muted">Total de Cajas</p>
          <p className="text-xl font-black text-byg-text tabular-nums font-mono tracking-tighter truncate">
            {formatMoney(totalCajasUSD, "USD")}
          </p>
          <p className="text-xs font-bold text-byg-muted tabular-nums font-mono truncate">
            {formatMoney(totalCajasARS, "ARS")}
          </p>
          <Link href="/caja" className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline mt-0.5 w-fit">
            Ver detalle de cajas →
          </Link>
        </div>

        {/* 4 — Resultado Cambio Mes (always shown) */}
        <div className="bg-byg-bg rounded-2xl border border-byg-border p-5 flex flex-col gap-1 relative overflow-hidden min-w-0">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Activity size={56} className="text-white" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-byg-muted relative">Resultado Cambio Mes</p>
          {resultadoCambio ? (
            <>
              <p className="text-xl font-black tabular-nums tracking-tighter text-byg-text relative truncate">
                {resultadoCambio.totalUSD >= 0 ? "+" : ""}{formatMoney(resultadoCambio.totalUSD, "USD")}
              </p>
              <p className="text-[10px] font-bold text-byg-muted uppercase relative">
                TC Blue: {resultadoCambio.tcBlue.toLocaleString("es-AR")}
              </p>
              <div className="flex gap-3 mt-1 relative flex-wrap">
                <span className="text-[10px] font-black text-byg-muted">
                  Neto USD: {formatMoney(resultadoCambio.USD.netoDivisa, "USD")}
                </span>
                <span className="text-[10px] font-black text-byg-muted">
                  Neto ARS: {formatMoney(resultadoCambio.USD.netoARS, "ARS")}
                </span>
              </div>
            </>
          ) : (
            <p className="text-xl font-black text-byg-muted relative">—</p>
          )}
        </div>
      </div>

      {/* 2. Módulo Operativa: title + day selector + filters + Nueva Carga */}
      <div className="bg-byg-surface rounded-2xl border border-byg-border relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-byg-accent" />
        <div className="px-6 pt-6 pb-5 flex flex-col gap-4">
          <p className="text-[10px] font-black text-byg-accent uppercase tracking-[0.3em]">Módulo Operativa</p>

          {/* Día Operativo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-byg-muted">Día Operativo</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="text-sm font-black text-byg-text border border-byg-border bg-byg-bg rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full"
            >
              {diasUnicos.map(d => (
                <option key={d} value={d}>{new Date(d + "T00:00:00Z").toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Filters row + Nueva Carga aligned right */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center">
              <select
                value={filtroCliente}
                onChange={(e) => setFiltroCliente(e.target.value)}
                className="text-[13px] font-bold text-byg-text border border-byg-border rounded-xl px-4 py-2 bg-byg-bg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-w-[200px] outline-none"
              >
                <option value="">Todos los clientes</option>
                {clientes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as TipoMovDiario | "")}
                className="text-[13px] font-bold text-byg-text border border-byg-border rounded-xl px-4 py-2 bg-byg-bg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              >
                <option value="">Todos los tipos</option>
                <option value="INGRESO">Ingresos</option>
                <option value="EGRESO">Egresos</option>
                <option value="CAMBIO">Cambio / Divisas</option>
              </select>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as EstadoMovDiario | "")}
                className="text-[13px] font-bold text-byg-text border border-byg-border rounded-xl px-4 py-2 bg-byg-bg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              >
                <option value="">Todos los estados</option>
                <option value="LIQUIDADA">Liquidada</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="PARCIAL">Parcial</option>
                <option value="REVERTIDA">Revertida</option>
              </select>
              {anyActive && (
                <button
                  onClick={() => { setSelectedDay(diasUnicos[0] || ""); setFiltroCliente(""); setFiltroTipo(""); setFiltroEstado(""); }}
                  className="text-[11px] font-black text-byg-muted hover:text-red-400 bg-byg-surface-2 hover:bg-red-500/10 transition-all px-4 py-2 rounded-xl uppercase tracking-widest"
                >
                  Limpiar
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowMovCaja(v => !v)}
                className={`text-[11px] font-black px-4 py-2 rounded-xl uppercase tracking-widest transition-all ${
                  showMovCaja
                    ? "bg-byg-accent/20 text-byg-accent"
                    : "bg-byg-surface-2 text-byg-muted hover:bg-byg-border"
                }`}
              >
                {showMovCaja ? "Ocultar entradas/salidas" : "Ver entradas/salidas"}
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>

      {/* 4. Movement tables */}
      <div className="flex flex-col gap-8">
        {saldadasGroups.length === 0 ? (
          <div className="bg-byg-surface rounded-3xl border border-byg-border p-20 text-center text-byg-muted font-medium italic">
            No se registraron movimientos saldados con estos filtros.
          </div>
        ) : (
          saldadasGroups.map(([day, dayRows]) => (
            <div key={day} className="flex flex-col gap-4">
              <div className="flex items-center gap-3 px-4">
                <div className="h-6 w-1 bg-byg-accent rounded-full"></div>
                <h2 className="text-[14px] font-black uppercase tracking-widest text-byg-text">
                  {fmtFechaHeader(day)}
                </h2>
              </div>

              <div className="bg-byg-surface rounded-3xl border border-byg-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead>
                      <tr className="bg-byg-bg border-b border-byg-border">
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-byg-muted tracking-widest w-[150px]">Tipo</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-byg-muted tracking-widest">Cliente</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-byg-muted tracking-widest text-right">Mov. Divisa</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-byg-muted tracking-widest text-center">TC</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-byg-muted tracking-widest text-right">Mov. Contrapartida</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-byg-muted tracking-widest text-center">Caja / Estado</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-byg-muted tracking-widest text-center w-[100px]">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-byg-border/40">
                      {dayRows.map((row) => {
                        const isCambio = row.tipo === "CAMBIO";
                        const isTransfer = (row.clasificacionOperativa as string) === "TRANSFERENCIA";
                        const isCompra = row.subTipo?.startsWith("COMPRA");
                        const isVenta = row.subTipo?.startsWith("VENTA");
                        const isIngreso = row.tipo === "INGRESO";
                        const isEgreso = row.tipo === "EGRESO";

                        let colorDivisa = "text-byg-text";
                        let colorContra = "text-byg-text";

                        if (isCambio) {
                          if (isCompra) {
                            colorDivisa = "text-emerald-600 dark:text-emerald-400";
                            colorContra = "text-rose-600 dark:text-rose-400";
                          } else if (isVenta) {
                            colorDivisa = "text-rose-600 dark:text-rose-400";
                            colorContra = "text-emerald-600 dark:text-emerald-400";
                          }
                        } else if (isTransfer) {
                          if (row.tipo === "INGRESO") colorDivisa = "text-emerald-600 dark:text-emerald-400";
                          else colorDivisa = "text-rose-600 dark:text-rose-400";
                        } else {
                          if (isIngreso) {
                            if (row.moneda === "ARS") colorContra = "text-emerald-600 dark:text-emerald-400";
                            else colorDivisa = "text-emerald-600 dark:text-emerald-400";
                          } else if (isEgreso) {
                            if (row.moneda === "ARS") colorContra = "text-rose-600 dark:text-rose-400";
                            else colorDivisa = "text-rose-600 dark:text-rose-400";
                          }
                        }

                        const isGroup = (row as any).isConsolidated && ((row as any).children?.length ?? 0) > 0;
                        const isGroupOpen = expandedGroups.has(row.id);
                        return (
                          <Fragment key={row.id}>
                          <tr className="hover:bg-byg-surface-2 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] font-black uppercase tracking-tighter text-byg-muted">
                                  {row.subTipo?.replace(/_/g, " ") || row.tipo}
                                </span>
                                {(row.clasificacionOperativa as string) === "TRANSFERENCIA" && (
                                  <span className="text-[7px] font-black bg-amber-500/10 text-amber-700 dark:text-amber-400 px-1 py-0.5 rounded border border-amber-500/20 uppercase mt-0.5">
                                    Transferencia
                                  </span>
                                )}
                                {(row as any).isConsolidated && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); toggleGroup(row.id); }}
                                    className="text-[8px] font-black text-blue-500 uppercase hover:text-blue-400 transition-colors"
                                  >
                                    {expandedGroups.has(row.id) ? "▲" : "▼"} {(row as any).rowCount} ops
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[13px] font-black text-byg-text">
                                  {row.cliente !== "—" ? row.cliente : (row.descripcion !== "—" ? row.descripcion : "—")}
                                </span>
                                {row.operador && (
                                  <span className="text-[9px] font-bold text-byg-muted uppercase tracking-wide">
                                    por {row.operador}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className={`px-6 py-4 text-right tabular-nums font-black text-[15px] ${colorDivisa}`}>
                              {row.moneda !== "ARS" ? formatMoney(row.monto, row.moneda) : "—"}
                            </td>
                            <td className="px-6 py-4 text-center tabular-nums font-mono text-[12px] font-bold text-byg-muted">
                              {row.tc ? row.tc.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                            </td>
                            <td className={`px-6 py-4 text-right tabular-nums font-black text-[15px] ${colorContra}`}>
                              {row.moneda === "ARS" ?
                                (isEgreso ? formatMoney(-row.monto, "ARS") : formatMoney(row.monto, "ARS")) :
                                (row.totalARS ? (isCompra ? formatMoney(-row.totalARS, "ARS") : formatMoney(row.totalARS, "ARS")) : "—")
                              }
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                {row.operador && (
                                  <span className="text-[9px] font-semibold text-byg-muted">por {row.operador}</span>
                                )}
                                <span className="text-[10px] font-bold text-byg-muted uppercase">
                                  {row.cajaLabel ?? "Sin liquidar"}
                                </span>
                                <div className="flex gap-1 flex-wrap justify-center">
                                  {row.impactaResultado && (
                                    <span className="text-[7px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1 py-0.5 rounded border border-emerald-500/20 uppercase">Resultado</span>
                                  )}
                                  <span className={`text-[7px] font-black px-1 py-0.5 rounded border uppercase ${
                                    row.estado === "REVERTIDA" ? "bg-gray-500/10 text-gray-400 border-gray-500/20" :
                                    row.estado === "PENDIENTE" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" :
                                    row.estado === "PARCIAL"   ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" :
                                    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  }`}>
                                    {row.estado === "PENDIENTE" ? "SIN LIQ." : row.estado}
                                  </span>
                                </div>
                              </div>
                            </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {canWrite &&
                               !(row as any).isConsolidated &&
                               (row.clasificacionOperativa as string) !== "TRANSFERENCIA" &&
                               (row.clasificacionOperativa === "RESULTADO_OPERATIVO" ||
                                (row.clasificacionOperativa === "MOVIMIENTO_CAJA")) && (
                                <div className="flex items-center gap-1">
                                  <EditMovButton row={row} />
                                  <DeleteMovButton id={row.id} />
                                </div>
                              )}

                              {canWrite && row.clasificacionOperativa === "CAMBIO" && !(row as any).isConsolidated && (
                                <div className="flex flex-col items-center gap-0.5">
                                  <EditCambioButton row={row} />
                                  {row.estado === "PENDIENTE"
                                    ? <CancelarPendienteButton id={row.id} />
                                    : <RevertirButton id={row.id} />
                                  }
                                </div>
                              )}
                              {((row as any).isConsolidated ||
                                (row.clasificacionOperativa as string) === "TRANSFERENCIA") && (
                                <div className="flex flex-col items-center">
                                  <span className="text-[8px] font-black uppercase text-byg-muted italic">Agrupado</span>
                                  <button disabled className="p-2 text-byg-border-2 cursor-not-allowed opacity-50">
                                    <Settings size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                          </tr>
                          {isGroup && isGroupOpen && ((row as any).children as MovDiarioRow[]).map((child) => (
                            <tr key={child.id} className="bg-byg-bg/60 border-l-4 border-l-blue-500/30">
                              <td className="px-6 py-3 pl-10">
                                <span className="text-[10px] font-black uppercase text-byg-muted">{child.subTipo?.replace(/_/g, " ") || child.tipo}</span>
                              </td>
                              <td className="px-6 py-3">
                                <span className="text-xs text-byg-muted">{child.cliente !== "—" ? child.cliente : child.descripcion}</span>
                              </td>
                              <td className="px-6 py-3 text-right tabular-nums font-mono text-xs text-byg-text">
                                {child.moneda !== "ARS" ? formatMoney(child.monto, child.moneda) : "—"}
                              </td>
                              <td className="px-6 py-3 text-center tabular-nums font-mono text-xs text-byg-muted">
                                {child.tc ? child.tc.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                              </td>
                              <td className="px-6 py-3 text-right tabular-nums font-mono text-xs text-byg-text">
                                {child.totalARS ? formatMoney(child.totalARS, "ARS") : "—"}
                              </td>
                              <td />
                              <td className="px-6 py-3 text-center">
                                {canWrite && child.clasificacionOperativa === "CAMBIO" && (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <EditCambioButton row={child} />
                                    {child.estado === "PENDIENTE"
                                      ? <CancelarPendienteButton id={child.id} />
                                      : <RevertirButton id={child.id} />
                                    }
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {pendientesOp.length > 0 && (
        <div className="flex flex-col gap-4 mt-6">
          <div className="flex items-center gap-3 px-4">
            <div className="h-6 w-1.5 bg-violet-500 rounded-full" />
            <div className="flex flex-col gap-0.5">
              <h3 className="text-[14px] font-black uppercase tracking-widest text-byg-text">Pendientes Operativos</h3>
              <p className="text-[9px] font-bold text-byg-muted uppercase tracking-wider">
                Guardas · Préstamos · Adelantos · Diferencias — registros históricos hasta su contrapartida
              </p>
            </div>
          </div>
          <div className="bg-byg-surface rounded-2xl border border-byg-border overflow-hidden border-b-4 border-b-violet-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-byg-bg border-b border-byg-border">
                    <th className="px-5 py-3 text-[10px] font-black uppercase text-byg-muted tracking-wider">Fecha</th>
                    <th className="px-5 py-3 text-[10px] font-black uppercase text-byg-muted tracking-wider">Tipo</th>
                    <th className="px-5 py-3 text-[10px] font-black uppercase text-byg-muted tracking-wider">Descripción</th>
                    <th className="px-5 py-3 text-[10px] font-black uppercase text-byg-muted tracking-wider text-right">Monto</th>
                    <th className="px-5 py-3 text-[10px] font-black uppercase text-byg-muted tracking-wider text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-byg-border/40">
                  {pendientesOp.map((r) => (
                    <tr key={r.id} className="hover:bg-byg-surface-2 transition-colors">
                      <td className="px-5 py-3 text-[11px] font-mono text-byg-muted">
                        {new Date(r.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                          r.tipo === "INGRESO"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}>
                          {r.subtipoOperativo?.replace(/_/g, " ") || r.tipo}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-byg-text">{r.descripcion || "—"}</td>
                      <td className={`px-5 py-3 text-right tabular-nums font-mono font-black text-sm ${r.tipo === "INGRESO" ? "text-emerald-500" : "text-rose-400"}`}>
                        {r.tipo === "INGRESO" ? "+" : "-"}{formatMoney(r.monto, r.moneda)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {canWrite && (
                          <div className="flex items-center justify-center gap-1">
                            <EditMovButton row={r} />
                            <DeleteMovButton id={r.id} />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {deudaPorCliente.length > 0 && (
        <div className="flex flex-col gap-3 mt-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-2 px-2">
            <div className="h-4 w-1 bg-amber-500 rounded-full"></div>
            <h3 className="text-[12px] font-black uppercase tracking-widest text-byg-text">Deuda Pendiente por Cliente</h3>
            <span className="text-[9px] font-bold text-byg-muted uppercase">({deudaPorCliente.length})</span>
          </div>

          <div className="bg-byg-surface rounded-2xl border border-byg-border overflow-hidden border-b-2 border-b-amber-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-byg-bg border-b border-byg-border">
                    <th className="px-4 py-2.5 text-[9px] font-black uppercase text-byg-muted tracking-widest">Cliente</th>
                    <th className="px-4 py-2.5 text-[9px] font-black uppercase text-byg-muted tracking-widest text-right">USD</th>
                    <th className="px-4 py-2.5 text-[9px] font-black uppercase text-byg-muted tracking-widest text-right">ARS</th>
                    <th className="px-4 py-2.5 text-[9px] font-black uppercase text-byg-muted tracking-widest text-center">Estado</th>
                    <th className="px-4 py-2.5 text-[9px] font-black uppercase text-byg-muted tracking-widest text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y-0">
                  {deudaPorCliente.map((d) => (
                    <Fragment key={d.cliente}>
                      <tr className="hover:bg-byg-surface-2 transition-all group border-b border-byg-border/40">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleDeuda(d.cliente)}
                              className="w-7 h-7 rounded-full bg-byg-surface-2 flex items-center justify-center text-byg-muted group-hover:bg-amber-500/20 group-hover:text-amber-400 transition-colors shrink-0"
                              title={expandedDeuda.has(d.cliente) ? "Contraer" : "Ver operaciones"}
                            >
                              <User size={13} />
                            </button>
                            <div className="flex flex-col">
                              <span className="text-[12px] font-black text-byg-text leading-tight">{d.cliente}</span>
                              <button
                                onClick={() => toggleDeuda(d.cliente)}
                                className="text-[9px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-tighter text-left"
                              >
                                {d.operaciones.length} {d.operaciones.length === 1 ? "op" : "ops"} {expandedDeuda.has(d.cliente) ? "▲" : "▼"}
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-[13px] font-black tabular-nums font-mono ${d.totalUSD > 0 ? "text-emerald-600 dark:text-emerald-400" : (d.totalUSD < 0 ? "text-rose-600 dark:text-rose-400" : "text-byg-muted")}`}>
                            {formatMoney(d.totalUSD, "USD")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-[13px] font-black tabular-nums font-mono ${d.totalARS > 0 ? "text-emerald-600 dark:text-emerald-400" : (d.totalARS < 0 ? "text-rose-600 dark:text-rose-400" : "text-byg-muted")}`}>
                            {formatMoney(d.totalARS, "ARS")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            {estadoDeuda(d.totalUSD, d.totalARS).map((b) => (
                              <span
                                key={b.moneda || "comp"}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${b.cls}`}
                              >
                                {b.label}{b.moneda ? ` (${b.moneda})` : ""}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {canWrite && <LiquidarPagoModal operaciones={d.operaciones} cajas={cajas ?? []} clienteNombre={d.cliente} />}
                        </td>
                      </tr>
                      {expandedDeuda.has(d.cliente) && (
                        <tr className="bg-byg-bg/40">
                          <td colSpan={5} className="px-4 py-2">
                            <div className="flex flex-col gap-1">
                              <p className="text-[9px] font-black uppercase tracking-widest text-byg-muted mb-1">Operaciones individuales</p>
                              {d.operaciones.map((op) => (
                                <div key={op.id} className="flex items-center py-1.5 px-3 rounded-lg bg-byg-surface border border-byg-border gap-3 flex-wrap">
                                  <span className="text-[10px] font-mono text-byg-muted shrink-0">
                                    {new Date(op.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", timeZone: "UTC" })}
                                  </span>
                                  <span className="text-[10px] font-black text-byg-text uppercase shrink-0">
                                    {op.subTipo?.replace(/_/g, " ") || op.tipo}
                                  </span>
                                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                                    op.estado === "REVERTIDA" ? "bg-gray-500/10 text-gray-400 border-gray-500/20" :
                                    op.estado === "PENDIENTE" ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" :
                                    op.estado === "PARCIAL"   ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" :
                                                                "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  }`}>
                                    {op.estado}
                                  </span>
                                  {op.descripcion && (
                                    <span className="text-[10px] text-byg-muted truncate flex-1 min-w-0">{op.descripcion}</span>
                                  )}
                                  <span className="text-[11px] font-black tabular-nums font-mono text-byg-text shrink-0 ml-auto">
                                    {formatMoney(op.monto, op.moneda)}
                                  </span>
                                  {canWrite && (
                                    <div className="shrink-0 flex items-center gap-1">
                                      {op.clasificacionOperativa === "CAMBIO" ? (
                                        <>
                                          <EditCambioButton row={op} />
                                          <CancelarPendienteButton id={op.id} />
                                        </>
                                      ) : (
                                        <>
                                          <EditMovButton row={op} />
                                          <DeleteMovButton id={op.id} />
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 px-1">
            <div className="bg-byg-surface rounded-xl p-3 border border-byg-border border-l-[3px] border-l-amber-500">
              <p className="text-[8px] font-black uppercase tracking-widest text-amber-400 mb-1">Total Deuda</p>
              <p className="text-[14px] font-black text-byg-text tabular-nums font-mono">
                {formatMoney(deudaPorCliente.reduce((acc, d) => acc + (d.totalUSD < 0 ? d.totalUSD : 0), 0), "USD")}
              </p>
            </div>
            <div className="bg-byg-surface rounded-xl p-3 border border-byg-border border-l-[3px] border-l-emerald-500">
              <p className="text-[8px] font-black uppercase tracking-widest text-emerald-400 mb-1">Total a Cobrar</p>
              <p className="text-[14px] font-black text-byg-text tabular-nums font-mono">
                {formatMoney(deudaPorCliente.reduce((acc, d) => acc + (d.totalUSD > 0 ? d.totalUSD : 0), 0), "USD")}
              </p>
            </div>
          </div>
        </div>
      )}

      <p className="text-[10px] text-byg-muted font-bold uppercase tracking-widest text-right mt-4">
        {filtered.length} Operaciones filtradas — {rows.length} Total
      </p>
    </div>
  );
}
