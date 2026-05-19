"use client";

import { useState, useMemo, useActionState, useEffect, Fragment } from "react";
import Link from "next/link";
import type { MovDiarioRow, TipoMovDiario, EstadoMovDiario } from "@/lib/data/mov-diarios-utils";
import { agruparPorCliente, normalizarNombreCliente } from "@/lib/data/mov-diarios-utils";
import { Trash2, Activity, Plus, User, X } from "lucide-react";
import {
  cobrarOperacionCambio,
  eliminarMovimientoCaja,
  cancelarOperacionCambioPendiente,
  editarMovimientoCajaCompleto,
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

function SumarPagoButton({ operaciones }: { operaciones: MovDiarioRow[] }) {
  const [state, action, pending] = useActionState(cobrarOperacionCambio, null);
  const cambioIds = operaciones.filter((op) => op.clasificacionOperativa === "CAMBIO").map((op) => op.id);

  if (state?.ok) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
        ✓ Cobrado
      </span>
    );
  }

  if (cambioIds.length === 0) {
    return <span className="text-[10px] text-byg-muted font-bold uppercase">Sin cambios</span>;
  }

  return (
    <form action={action} className="flex flex-col gap-1 items-center">
      {cambioIds.map((id) => (
        <input key={id} type="hidden" name="operacionId" value={id} />
      ))}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-byg-accent text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
      >
        <Plus size={12} /> {pending ? "Registrando…" : "Sumar Pago"}
      </button>
      {state?.error && (
        <span className="text-[9px] text-red-500 font-semibold mt-1">{state.error}</span>
      )}
    </form>
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
      result.set(day, dayConsolidated);
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
      const filteredDay = dayRows.filter(r => r.estado !== "PENDIENTE");
      if (filteredDay.length > 0) map.set(day, filteredDay);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [consolidated]);

  const deudaPorCliente = useMemo(() => {
    const pendientes = filtered.filter(r => r.estado === "PENDIENTE");
    return Object.values(agruparPorCliente(pendientes)).sort((a, b) => a.cliente.localeCompare(b.cliente));
  }, [filtered]);

  const [expandedDeuda, setExpandedDeuda] = useState<Set<string>>(new Set());
  const toggleDeuda = (cliente: string) =>
    setExpandedDeuda((prev) => {
      const next = new Set(prev);
      next.has(cliente) ? next.delete(cliente) : next.add(cliente);
      return next;
    });

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
                <option value="COBRADO">Saldado / Cobrado</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="PARCIAL">Parcial</option>
              </select>
              {anyActive && (
                <button
                  onClick={() => { setSelectedDay(diasUnicos[0] || ""); setFiltroCliente(""); setFiltroTipo(""); setFiltroEstado(""); }}
                  className="text-[11px] font-black text-byg-muted hover:text-red-400 bg-byg-surface-2 hover:bg-red-500/10 transition-all px-4 py-2 rounded-xl uppercase tracking-widest"
                >
                  Limpiar
                </button>
              )}
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

                        return (
                          <tr key={row.id} className="hover:bg-byg-surface-2 transition-colors group">
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
                                  <span className="text-[8px] font-black text-blue-500 uppercase">
                                    {(row as any).rowCount} operaciones
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[13px] font-black text-byg-text">{row.cliente}</span>
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
                                <span className="text-[10px] font-bold text-byg-muted uppercase">Oficina</span>
                                <div className="flex gap-1">
                                  {row.impactaResultado && (
                                    <span className="text-[7px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1 py-0.5 rounded border border-emerald-500/20 uppercase">Resultado</span>
                                  )}
                                  <span className="text-[7px] font-black bg-byg-surface-2 text-byg-muted px-1 py-0.5 rounded border border-byg-border uppercase">Caja</span>
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

                              {((row as any).isConsolidated ||
                                (row.clasificacionOperativa as string) === "TRANSFERENCIA" ||
                                (row.clasificacionOperativa === "CAMBIO")) && (
                                <div className="flex flex-col items-center">
                                  <span className="text-[8px] font-black uppercase text-byg-muted italic">Editar operación origen</span>
                                  <button
                                    disabled
                                    className="p-2 text-byg-border-2 cursor-not-allowed opacity-50"
                                  >
                                    <Settings size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                          </tr>
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

      {deudaPorCliente.length > 0 && (
        <div className="flex flex-col gap-6 mt-12 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between px-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="h-6 w-1.5 bg-amber-500 rounded-full"></div>
                <h3 className="text-xl font-black uppercase tracking-tight text-byg-text">Modelo de Deuda por Cliente</h3>
              </div>
              <p className="text-[10px] font-bold text-byg-muted uppercase tracking-widest pl-4">Consolidado de saldos pendientes</p>
            </div>
          </div>

          <div className="bg-byg-surface rounded-3xl border border-byg-border overflow-hidden border-b-4 border-b-amber-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-byg-bg border-b border-byg-border">
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-byg-muted tracking-widest">Cliente</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-byg-muted tracking-widest text-right">Saldo USD</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-byg-muted tracking-widest text-right">Saldo ARS</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-byg-muted tracking-widest text-center">Estado</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-byg-muted tracking-widest text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y-0">
                  {deudaPorCliente.map((d) => (
                    <Fragment key={d.cliente}>
                      <tr className="hover:bg-byg-surface-2 transition-all group border-b border-byg-border/40">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleDeuda(d.cliente)}
                              className="w-10 h-10 rounded-full bg-byg-surface-2 flex items-center justify-center text-byg-muted group-hover:bg-amber-500/20 group-hover:text-amber-700 dark:text-amber-400 transition-colors shrink-0"
                              title={expandedDeuda.has(d.cliente) ? "Contraer" : "Ver operaciones"}
                            >
                              <User size={18} />
                            </button>
                            <div className="flex flex-col">
                              <span className="text-[15px] font-black text-byg-text leading-tight">{d.cliente}</span>
                              <button
                                onClick={() => toggleDeuda(d.cliente)}
                                className="text-[9px] font-bold text-blue-500 hover:text-blue-700 uppercase tracking-tighter text-left"
                              >
                                {d.operaciones.length} {d.operaciones.length === 1 ? "operación pendiente" : "operaciones"} {expandedDeuda.has(d.cliente) ? "▲" : "▼"}
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className={`text-lg font-black tabular-nums font-mono transition-colors ${d.totalUSD > 0 ? "text-emerald-600 dark:text-emerald-400" : (d.totalUSD < 0 ? "text-rose-600 dark:text-rose-400" : "text-byg-muted")}`}>
                            {formatMoney(d.totalUSD, "USD")}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className={`text-lg font-black tabular-nums font-mono transition-colors ${d.totalARS > 0 ? "text-emerald-600 dark:text-emerald-400" : (d.totalARS < 0 ? "text-rose-600 dark:text-rose-400" : "text-byg-muted")}`}>
                            {formatMoney(d.totalARS, "ARS")}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {estadoDeuda(d.totalUSD, d.totalARS).map((b) => (
                              <span
                                key={b.moneda || "comp"}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${b.cls}`}
                              >
                                {b.label}{b.moneda ? ` (${b.moneda})` : ""}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          {canWrite && <SumarPagoButton operaciones={d.operaciones} />}
                        </td>
                      </tr>
                      {expandedDeuda.has(d.cliente) && (
                        <tr className="bg-byg-bg/40">
                          <td colSpan={5} className="px-8 py-3">
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
                                    <div className="shrink-0">
                                      {op.clasificacionOperativa === "CAMBIO" ? (
                                        <CancelarPendienteButton id={op.id} />
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          <EditMovButton row={op} />
                                          <DeleteMovButton id={op.id} />
                                        </div>
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-byg-surface rounded-2xl p-6 border border-byg-border border-l-[4px] border-l-amber-500">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-2">Total Deuda USD</p>
              <p className="text-2xl font-black text-byg-text tabular-nums font-mono">
                {formatMoney(deudaPorCliente.reduce((acc, d) => acc + (d.totalUSD < 0 ? d.totalUSD : 0), 0), "USD")}
              </p>
              <p className="text-[9px] font-bold text-byg-muted uppercase mt-1">Saldo negativo (lo que debemos)</p>
            </div>
            <div className="bg-byg-surface rounded-2xl p-6 border border-byg-border border-l-[4px] border-l-emerald-500">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">Total a Cobrar USD</p>
              <p className="text-2xl font-black text-byg-text tabular-nums font-mono">
                {formatMoney(deudaPorCliente.reduce((acc, d) => acc + (d.totalUSD > 0 ? d.totalUSD : 0), 0), "USD")}
              </p>
              <p className="text-[9px] font-bold text-byg-muted uppercase mt-1">Saldo positivo (lo que nos deben)</p>
            </div>
            <div className="bg-byg-surface rounded-2xl p-6 border border-byg-border flex flex-col justify-center">
              <button
                disabled
                className="w-full py-3 rounded-xl border-2 border-dashed border-byg-border-2 text-byg-muted text-[10px] font-black uppercase tracking-widest cursor-not-allowed"
              >
                Próximamente: Reporte de Deuda PDF
              </button>
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
