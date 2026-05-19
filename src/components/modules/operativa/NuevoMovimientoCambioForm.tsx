"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { crearOperacionCambio } from "@/app/(dashboard)/operativa/mov-diarios/actions";
import { RefreshCw, Loader2, ArrowRightLeft, Info } from "lucide-react";

type Caja = {
  id: string;
  label: string;
  slug: string;
  esPrincipal: boolean;
  saldoUSD: number;
  saldoARS: number;
};

type Props = {
  cajas: Caja[];
};

const init: { error?: string; ok?: boolean } = {};

const INPUT_CLS = "bg-byg-bg border border-byg-border rounded-xl px-3 py-2 text-sm text-byg-text focus:outline-none focus:ring-1 focus:ring-byg-accent/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none";
const LABEL_CLS = "text-[10px] font-black uppercase tracking-widest text-byg-muted";

export function NuevoMovimientoCambioForm({ cajas }: Props) {
  const [state, action, pending] = useActionState(crearOperacionCambio, init);
  const [cantidad, setCantidad] = useState<string>("");
  const [tc, setTc] = useState<string>("");
  const [estado, setEstado] = useState<string>("COBRADA");
  const [tipoOp, setTipoOp] = useState<string>("COMPRA");
  const [moneda, setMoneda] = useState<string>("USD");
  const [impactoCC, setImpactoCC] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setCantidad("");
      setTc("");
      setImpactoCC(false);
    }
  }, [state.ok]);

  const cajaOficina = cajas.find(c => c.esPrincipal || c.slug === "oficina");

  const numCantidad = parseFloat(cantidad.replace(",", ".")) || 0;
  const numTC = parseFloat(tc.replace(",", ".")) || 0;
  const numTotalARS = numCantidad * numTC;

  const totalCalculado = numTotalARS.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  let advertencia = "";
  if (estado === "COBRADA" && cajaOficina) {
    if (tipoOp === "COMPRA" && cajaOficina.saldoARS < numTotalARS) {
      advertencia = "Advertencia: la Caja Oficina ARS quedaría con saldo negativo.";
    } else if (tipoOp === "VENTA" && cajaOficina.saldoUSD < numCantidad) {
      advertencia = "Advertencia: la Caja Oficina USD quedaría con saldo negativo.";
    }
  }

  return (
    <section className="bg-byg-surface rounded-2xl border border-byg-border overflow-hidden flex flex-col relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
      <div className="px-6 py-4 border-b border-byg-border bg-byg-bg/40">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-byg-text flex items-center gap-2">
          <RefreshCw size={14} className="text-emerald-400" />
          Nueva Operación de Cambio
        </h2>
      </div>

      <form ref={formRef} action={action} className="p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {/* Fecha */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLS}>Fecha</label>
            <input
              name="fecha"
              type="date"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
              className={INPUT_CLS}
            />
          </div>

          {/* Tipo de Operación */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLS}>Operación</label>
            <select
              name="tipoOperacion"
              required
              value={tipoOp}
              onChange={(e) => setTipoOp(e.target.value)}
              className={`${INPUT_CLS} font-bold`}
            >
              <option value="COMPRA">COMPRA (+)</option>
              <option value="VENTA">VENTA (-)</option>
            </select>
          </div>

          {/* Moneda */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLS}>Moneda Divisa</label>
            <select
              name="moneda"
              required
              value={moneda}
              onChange={(e) => setMoneda(e.target.value)}
              className={`${INPUT_CLS} font-bold`}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="BRL">BRL</option>
            </select>
          </div>

          {/* Cliente */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLS}>Cliente (Nombre)</label>
            <input
              name="clienteNombre"
              type="text"
              placeholder="Ej: Juan Perez"
              className={`${INPUT_CLS} placeholder:text-byg-muted/50`}
            />
          </div>

          {/* Cantidad */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLS}>Cantidad (Divisa)</label>
            <input
              name="cantidad"
              type="number"
              step="0.01"
              required
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="0.00"
              className={`${INPUT_CLS} font-bold tabular-nums font-mono`}
            />
          </div>

          {/* Tipo de Cambio */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLS}>Tipo de Cambio</label>
            <input
              name="tipoCambio"
              type="number"
              step="0.01"
              required
              value={tc}
              onChange={(e) => setTc(e.target.value)}
              placeholder="0.00"
              className={`${INPUT_CLS} font-bold tabular-nums font-mono`}
            />
          </div>

          {/* Total ARS */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLS}>Total en ARS (Estimado)</label>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 text-sm font-black text-emerald-400 tabular-nums font-mono h-[38px] flex items-center">
              $ {totalCalculado}
            </div>
            {advertencia && (
              <p className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 animate-pulse">
                ⚠️ {advertencia}
              </p>
            )}
          </div>

          {/* Estado */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLS}>Estado de Operación</label>
            <select
              name="estado"
              required
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className={`border rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-1 ${
                estado === "COBRADA"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 focus:ring-emerald-400/40"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400 focus:ring-amber-400/40"
              }`}
            >
              <option value="COBRADA">COBRADA (Impacta Oficina)</option>
              <option value="PENDIENTE">PENDIENTE (Solo Registro)</option>
            </select>
          </div>

          {/* Impacto CC */}
          <div className="flex flex-col gap-1.5 lg:col-span-1">
            <label className={LABEL_CLS}>Impacto Cliente</label>
            <div className="flex items-center gap-3 bg-byg-bg border border-byg-border rounded-xl px-4 py-2 h-[38px]">
              <input
                id="impactoCC"
                name="impactoCC"
                type="checkbox"
                checked={impactoCC}
                onChange={(e) => setImpactoCC(e.target.checked)}
                className="w-4 h-4 rounded border-byg-border accent-byg-accent"
              />
              <label htmlFor="impactoCC" className="text-xs font-bold text-byg-text cursor-pointer">
                Impactar CC del cliente
              </label>
            </div>
          </div>

          {impactoCC && (
            <div className="lg:col-span-3 xl:col-span-4 bg-byg-accent/10 border border-byg-accent/20 rounded-xl p-3 flex items-center gap-2">
              <Info size={16} className="text-byg-accent shrink-0" />
              <p className="text-[11px] font-bold text-byg-accent">
                Aviso: La integración real con la Cuenta Corriente se implementará en el próximo bloque.
              </p>
            </div>
          )}

          {/* Descripción */}
          <div className="flex flex-col gap-1.5 lg:col-span-2 xl:col-span-3">
            <label className={LABEL_CLS}>Descripción / Notas</label>
            <input
              name="descripcion"
              type="text"
              placeholder="Detalle opcional..."
              className={`${INPUT_CLS} placeholder:text-byg-muted/50`}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-byg-accent hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-black uppercase tracking-[0.2em] py-4 rounded-xl transition-all shadow-sm shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            {pending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Registrando Operación...
              </>
            ) : (
              <>
                <ArrowRightLeft size={16} />
                Registrar Operación de Cambio
              </>
            )}
          </button>

          {state.error && (
            <p className="text-[11px] font-black uppercase text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 text-center">
              ⚠️ {state.error}
            </p>
          )}
          {state.ok && (
            <p className="text-[11px] font-black uppercase text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 text-center">
              ✓ Operación de cambio registrada con éxito
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
