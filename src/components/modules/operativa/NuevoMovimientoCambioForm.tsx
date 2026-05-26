"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { crearOperacionCambio } from "@/app/(dashboard)/operativa/mov-diarios/actions";
import { RefreshCw, Loader2, ArrowRightLeft, Info, CheckCircle2 } from "lucide-react";

type Caja = {
  id: string;
  label: string;
  slug: string;
  esPrincipal: boolean;
  saldoUSD: number;
  saldoARS: number;
};

type ClienteCC = { id: string; nombre: string; ccUSD: number; ccARS: number };

type TipoLiq = "TOTAL" | "PARCIAL";

type Props = {
  cajas: Caja[];
  clientes?: ClienteCC[];
  onSuccess?: () => void;
};

const init: { error?: string; ok?: boolean } = {};

const INPUT_CLS = "bg-byg-bg border border-byg-border rounded-xl px-3 py-2 text-sm text-byg-text focus:outline-none focus:ring-1 focus:ring-byg-accent/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none";
const LABEL_CLS = "text-[10px] font-black uppercase tracking-widest text-byg-muted";

function fmtCC(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function NuevoMovimientoCambioForm({ cajas, clientes = [], onSuccess }: Props) {
  const [state, action, pending] = useActionState(crearOperacionCambio, init);
  const [cantidad, setCantidad]       = useState<string>("");
  const [tc, setTc]                   = useState<string>("");
  const [tipoOp, setTipoOp]           = useState<string>("COMPRA");
  const [moneda, setMoneda]           = useState<string>("USD");
  const [nombre, setNombre]           = useState<string>("");
  const [impactoCC, setImpactoCC]     = useState<boolean>(false);
  const [clienteIdManual, setClienteIdManual] = useState<string>("");

  // Liquidación
  const [liquidada, setLiquidada]     = useState(false);
  const [tipoLiq, setTipoLiq]         = useState<TipoLiq>("TOTAL");
  const [cajaLiqId, setCajaLiqId]     = useState<string>(() => cajas.find(c => c.esPrincipal || c.slug === "oficina")?.id ?? cajas[0]?.id ?? "");
  const [cantPorCaja, setCantPorCaja] = useState<Record<string, { div: string; ars: string }>>({});

  const formRef = useRef<HTMLFormElement>(null);

  const estadoOp = !liquidada ? "NO_LIQUIDADA" : (tipoLiq === "TOTAL" ? "LIQUIDADA" : "PARCIAL");

  const clienteDetectado = useMemo(() => {
    if (!impactoCC || !nombre.trim()) return null;
    const norm = nombre.trim().toLowerCase();
    return clientes.find(c => c.nombre.toLowerCase() === norm) ?? null;
  }, [impactoCC, nombre, clientes]);

  const clienteId = clienteDetectado?.id ?? (impactoCC ? clienteIdManual : "");
  const clienteResuelto = clienteDetectado ?? (clienteIdManual && impactoCC ? clientes.find(c => c.id === clienteIdManual) ?? null : null);

  const numCantidad = parseFloat(cantidad.replace(",", ".")) || 0;
  const numTC       = parseFloat(tc.replace(",", ".")) || 0;
  const numTotalARS = numCantidad * numTC;
  const totalCalculado = numTotalARS.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const esCompra = tipoOp === "COMPRA";
  const ccMonedaDelta = clienteResuelto ? (esCompra ? -numCantidad : numCantidad) : 0;
  const ccARSDelta    = clienteResuelto ? (esCompra ? numTotalARS : -numTotalARS) : 0;
  const ccMonedaAfter = clienteResuelto ? (moneda === "USD" ? clienteResuelto.ccUSD + ccMonedaDelta : 0) : 0;
  const ccARSAfter    = clienteResuelto ? (clienteResuelto.ccARS + ccARSDelta) : 0;

  // Advertencia saldo negativo
  let advertencia = "";
  if (liquidada) {
    const cajaRef = tipoLiq === "TOTAL"
      ? cajas.find(c => c.id === cajaLiqId)
      : undefined;
    if (cajaRef) {
      if (esCompra && cajaRef.saldoARS < numTotalARS)
        advertencia = `Advertencia: ${cajaRef.label} ARS quedaría con saldo negativo.`;
      else if (!esCompra && cajaRef.saldoUSD < numCantidad)
        advertencia = `Advertencia: ${cajaRef.label} USD quedaría con saldo negativo.`;
    }
  }

  // Totales PARCIAL
  const totalDivLiq = cajas.reduce((s, c) => s + (parseFloat(cantPorCaja[c.id]?.div ?? "0") || 0), 0);
  const totalARSLiq = cajas.reduce((s, c) => s + (parseFloat(cantPorCaja[c.id]?.ars ?? "0") || 0), 0);
  const restDiv = Math.max(0, numCantidad - totalDivLiq);
  const restARS = Math.max(0, numTotalARS - totalARSLiq);

  function setDivForCaja(cajaId: string, div: string) {
    const divNum = parseFloat(div.replace(",", ".")) || 0;
    const arsAuto = (divNum * numTC).toFixed(2);
    setCantPorCaja(p => ({
      ...p,
      [cajaId]: { div, ars: p[cajaId]?.ars ?? arsAuto },
    }));
  }

  function setARSForCaja(cajaId: string, ars: string) {
    setCantPorCaja(p => ({
      ...p,
      [cajaId]: { div: p[cajaId]?.div ?? "", ars },
    }));
  }

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setCantidad(""); setTc(""); setNombre(""); setClienteIdManual("");
      setImpactoCC(false); setLiquidada(false); setTipoLiq("TOTAL"); setCantPorCaja({});
      const t = setTimeout(() => onSuccess?.(), 600);
      return () => clearTimeout(t);
    }
  }, [state.ok]);

  return (
    <section className="bg-byg-surface rounded-2xl border border-byg-border overflow-hidden flex flex-col relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
      <div className="px-6 py-4 border-b border-byg-border bg-byg-bg/40">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-byg-text flex items-center gap-2">
          <RefreshCw size={14} className="text-emerald-400" />
          Nueva Operación de Cambio
        </h2>
      </div>

      <form ref={formRef} action={action} className="p-6 flex flex-col gap-5">
        <input type="hidden" name="clienteId" value={clienteId} />
        <input type="hidden" name="estadoOp"  value={estadoOp} />
        {estadoOp === "LIQUIDADA" && <input type="hidden" name="cajaLiqId" value={cajaLiqId} />}

        {/* Fila 1: fecha, tipo, moneda, cantidad, TC, total, nombre */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLS}>Fecha</label>
            <input name="fecha" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className={INPUT_CLS} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLS}>Operación</label>
            <select name="tipoOperacion" required value={tipoOp} onChange={e => setTipoOp(e.target.value)} className={`${INPUT_CLS} font-bold`}>
              <option value="COMPRA">COMPRA (+)</option>
              <option value="VENTA">VENTA (−)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLS}>Moneda Divisa</label>
            <select name="moneda" required value={moneda} onChange={e => setMoneda(e.target.value)} className={`${INPUT_CLS} font-bold`}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="BRL">BRL</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLS}>Cantidad Divisa</label>
            <input name="cantidad" type="number" step="0.01" required value={cantidad} onChange={e => setCantidad(e.target.value)} placeholder="0.00" className={`${INPUT_CLS} font-bold tabular-nums font-mono`} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLS}>Tipo de Cambio</label>
            <input name="tipoCambio" type="number" step="0.01" required value={tc} onChange={e => setTc(e.target.value)} placeholder="0.00" className={`${INPUT_CLS} font-bold tabular-nums font-mono`} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLS}>Total ARS (estimado)</label>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 text-sm font-black text-emerald-400 tabular-nums font-mono h-[38px] flex items-center">
              $ {totalCalculado}
            </div>
            {advertencia && (
              <p className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                ⚠️ {advertencia}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLS}>Nombre</label>
            <input name="clienteNombre" type="text" list="cambio-nombres-list" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Chule, Pipe..." className={`${INPUT_CLS} placeholder:text-byg-muted/50`} />
            <datalist id="cambio-nombres-list">
              {clientes.map(c => <option key={c.id} value={c.nombre} />)}
            </datalist>
          </div>
        </div>

        {/* Liquidación — nivel 1: No liquidada / Liquidada */}
        <div className="flex flex-col gap-3">
          <label className={LABEL_CLS}>Estado / Liquidación</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setLiquidada(false)}
              className={`text-[11px] font-black px-4 py-2 rounded-xl border uppercase tracking-wider transition-all ${
                !liquidada
                  ? "bg-byg-bg border-byg-border text-byg-text ring-1 ring-offset-1 ring-offset-byg-surface ring-byg-border"
                  : "bg-byg-bg border-byg-border text-byg-muted opacity-50 hover:opacity-70"
              }`}
            >
              No liquidada
            </button>
            <button
              type="button"
              onClick={() => setLiquidada(true)}
              className={`text-[11px] font-black px-4 py-2 rounded-xl border uppercase tracking-wider transition-all ${
                liquidada
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 ring-1 ring-offset-1 ring-offset-byg-surface ring-emerald-500/30"
                  : "bg-byg-bg border-byg-border text-byg-muted opacity-50 hover:opacity-70"
              }`}
            >
              Liquidada
            </button>
          </div>

          {/* Nivel 2: Total / Parcial */}
          {liquidada && (
            <div className="pl-3 border-l-2 border-emerald-500/30 flex flex-col gap-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTipoLiq("TOTAL")}
                  className={`text-[11px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-wider transition-all ${
                    tipoLiq === "TOTAL"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-byg-bg border-byg-border text-byg-muted opacity-50 hover:opacity-70"
                  }`}
                >
                  Total — una caja
                </button>
                <button
                  type="button"
                  onClick={() => setTipoLiq("PARCIAL")}
                  className={`text-[11px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-wider transition-all ${
                    tipoLiq === "PARCIAL"
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      : "bg-byg-bg border-byg-border text-byg-muted opacity-50 hover:opacity-70"
                  }`}
                >
                  Parcial — varias cajas
                </button>
              </div>

              {/* TOTAL: selector de caja */}
              {tipoLiq === "TOTAL" && (
                <div className="flex flex-col gap-1.5">
                  <label className={LABEL_CLS}>Caja</label>
                  <select
                    value={cajaLiqId}
                    onChange={e => setCajaLiqId(e.target.value)}
                    className={`${INPUT_CLS} max-w-xs font-medium`}
                  >
                    {cajas.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              )}

              {/* PARCIAL: grilla por caja */}
              {tipoLiq === "PARCIAL" && (
                <div className="flex flex-col gap-2">
                  <div className="overflow-x-auto rounded-xl border border-byg-border">
                    <table className="w-full text-left border-collapse min-w-[480px]">
                      <thead>
                        <tr className="bg-byg-bg border-b border-byg-border">
                          <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted">Caja</th>
                          <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted text-right">{moneda}</th>
                          <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-byg-muted text-right">ARS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-byg-border/40">
                        {cajas.map(c => (
                          <tr key={c.id} className="hover:bg-byg-surface-2">
                            <td className="px-4 py-2 text-[11px] font-bold text-byg-text whitespace-nowrap">{c.label}</td>
                            <td className="px-2 py-1.5">
                              <input
                                type="number"
                                name={`cajaLiq_${c.id}_div`}
                                step="0.01" min="0"
                                value={cantPorCaja[c.id]?.div ?? ""}
                                onChange={e => setDivForCaja(c.id, e.target.value)}
                                placeholder="0.00"
                                className={`${INPUT_CLS} w-full text-right font-mono tabular-nums text-sm py-1.5`}
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                type="number"
                                name={`cajaLiq_${c.id}_ars`}
                                step="0.01" min="0"
                                value={cantPorCaja[c.id]?.ars ?? ""}
                                onChange={e => setARSForCaja(c.id, e.target.value)}
                                placeholder="0.00"
                                className={`${INPUT_CLS} w-full text-right font-mono tabular-nums text-sm py-1.5`}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {numCantidad > 0 && (
                    <div className="flex flex-wrap gap-3 text-[11px] font-mono tabular-nums px-1">
                      <span className="text-byg-muted">Total:</span>
                      <span className="font-black text-byg-text">{fmtCC(numCantidad)} {moneda}</span>
                      <span className="text-byg-muted">/ $ {fmtCC(numTotalARS)}</span>
                      <span className="text-byg-muted">Liquidado:</span>
                      <span className="font-black text-emerald-400">{fmtCC(totalDivLiq)} {moneda}</span>
                      <span className="font-black text-emerald-400">/ $ {fmtCC(totalARSLiq)}</span>
                      {(restDiv > 0 || restARS > 0) && (
                        <>
                          <span className="text-byg-muted">Pendiente:</span>
                          <span className="font-black text-amber-400">{fmtCC(restDiv)} {moneda}</span>
                          <span className="font-black text-amber-400">/ $ {fmtCC(restARS)}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* CC */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2.5 cursor-pointer group w-fit">
            <input type="checkbox" name="impactoCC" checked={impactoCC} onChange={e => { setImpactoCC(e.target.checked); if (!e.target.checked) setClienteIdManual(""); }} className="w-4 h-4 accent-emerald-500 cursor-pointer" />
            <span className="text-xs font-bold text-byg-muted group-hover:text-byg-text transition-colors uppercase tracking-widest">
              Impacta Cuenta Corriente
            </span>
          </label>

          {impactoCC && (
            clienteDetectado ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 w-fit">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wide">
                  CC detectada: {clienteDetectado.nombre}
                </span>
              </div>
            ) : (
              <select value={clienteIdManual} onChange={e => { const id = e.target.value; setClienteIdManual(id); if (id) { const c = clientes.find(x => x.id === id); if (c) setNombre(c.nombre); } }} className={`${INPUT_CLS} max-w-xs font-medium text-sm`}>
                <option value="">Seleccionar cliente con CC…</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            )
          )}
        </div>

        {/* Descripción */}
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLS}>Descripción / Notas</label>
          <input name="descripcion" type="text" placeholder="Detalle opcional..." className={`${INPUT_CLS} placeholder:text-byg-muted/50`} />
        </div>

        {/* Panel CC proyectado */}
        {impactoCC && clienteResuelto && numCantidad > 0 && numTC > 0 && (
          <div className="bg-byg-bg rounded-xl border border-byg-border px-5 py-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <Info size={13} className="text-byg-accent shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest text-byg-accent">
                Impacto CC — {clienteResuelto.nombre}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-[11px] font-bold">
              <div className="flex flex-col gap-1">
                <span className="text-byg-muted uppercase text-[9px] tracking-widest">CC {moneda} (actual → después)</span>
                <div className="flex items-center gap-2 tabular-nums font-mono">
                  <span className={moneda === "USD" ? (clienteResuelto.ccUSD < 0 ? "text-red-400" : "text-byg-muted") : "text-byg-muted"}>
                    {moneda === "USD" ? fmtCC(clienteResuelto.ccUSD) : "—"}
                  </span>
                  <span className="text-byg-border-2">→</span>
                  <span className={ccMonedaAfter < 0 ? "text-red-400 font-black" : "text-emerald-400 font-black"}>
                    {moneda === "USD" ? fmtCC(ccMonedaAfter) : `${ccMonedaDelta >= 0 ? "+" : ""}${fmtCC(ccMonedaDelta)}`}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-byg-muted uppercase text-[9px] tracking-widest">CC ARS (actual → después)</span>
                <div className="flex items-center gap-2 tabular-nums font-mono">
                  <span className={clienteResuelto.ccARS < 0 ? "text-red-400" : "text-byg-muted"}>{fmtCC(clienteResuelto.ccARS)}</span>
                  <span className="text-byg-border-2">→</span>
                  <span className={ccARSAfter < 0 ? "text-red-400 font-black" : "text-emerald-400 font-black"}>{fmtCC(ccARSAfter)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex flex-col gap-3">
          <button type="submit" disabled={pending} className="w-full bg-byg-accent hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-black uppercase tracking-[0.2em] py-4 rounded-xl transition-all shadow-sm shadow-blue-600/20 flex items-center justify-center gap-2">
            {pending ? (<><Loader2 size={16} className="animate-spin" /> Registrando...</>) : (<><ArrowRightLeft size={16} /> Registrar Operación de Cambio</>)}
          </button>

          {state.error && (
            <p className="text-[11px] font-black uppercase text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 text-center">
              ⚠️ {state.error}
            </p>
          )}
          {state.ok && (
            <p className="text-[11px] font-black uppercase text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 text-center">
              ✓ Operación registrada con éxito
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
