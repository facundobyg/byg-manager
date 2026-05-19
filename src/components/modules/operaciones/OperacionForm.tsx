"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { ejecutarOperacion } from "@/app/(dashboard)/clientes/actions";
import { readOnlyPreview } from "@/lib/config";

type TipoOp = "RULO" | "DIVISA" | "LP";
type ActionResult = {
  success?: boolean;
  error?: string;
  tipo?: "LP";
  plazoFijoId?: string;
  clienteId?: string;
  capital?: string;
  fechaVencimiento?: string;
} | null;

interface CuentaCC {
  moneda: string;
}

interface Cliente {
  id: string;
  nombre: string;
  cuentasCorrientes?: CuentaCC[];
}

const inputCls =
  "border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 w-full focus:outline-none focus:ring-2 focus:ring-blue-100";
const labelCls = "text-xs font-semibold text-slate-500";

function fmtNum(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function OperacionForm({ clientes }: { clientes: Cliente[] }) {
  const [tipo, setTipo] = useState<TipoOp>("RULO");
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? "");
  const [monto, setMonto] = useState("");
  const [monedaOrigen, setMonedaOrigen] = useState("USD");
  const [monedaDestino, setMonedaDestino] = useState("ARS");
  const [tasa, setTasa] = useState("");
  const [tipoCambio, setTipoCambio] = useState("");
  const [plazo, setPlazo] = useState("");

  const [state, action, pending] = useActionState<ActionResult, FormData>(
    (_prev: ActionResult, fd: FormData) => ejecutarOperacion(fd),
    null
  );

  const cliente = clientes.find((c) => c.id === clienteId);
  const monedas = cliente?.cuentasCorrientes?.length
    ? Array.from(new Set(cliente.cuentasCorrientes.map((cc) => cc.moneda)))
    : ["USD", "ARS"];

  const montoN = parseFloat(monto) || 0;
  const tasaN = parseFloat(tasa) || 0;
  const tcN = parseFloat(tipoCambio) || 0;
  const plazoN = parseFloat(plazo) || 0;

  let preview = "—";
  if (tipo === "RULO" && montoN > 0 && tasaN > 0)
    preview = fmtNum(montoN * (1 + tasaN / 100));
  else if (tipo === "DIVISA" && montoN > 0 && tcN > 0)
    preview = fmtNum(montoN * tcN);
  else if (tipo === "LP" && montoN > 0 && tasaN > 0 && plazoN > 0)
    preview = fmtNum(montoN + montoN * (tasaN / 100) * (plazoN / 365));

  return (
    <form action={action} className="flex flex-col gap-5 bg-white border border-slate-100 rounded-xl p-6">
      <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Nueva operación</h2>

      {/* Tipo selector */}
      <div className="flex gap-2">
        {(["RULO", "DIVISA", "LP"] as TipoOp[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-colors ${
              tipo === t
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-500 hover:border-slate-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <input type="hidden" name="tipo" value={tipo} />

      {/* Cliente */}
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Cliente</label>
        <select
          name="clienteId"
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className={inputCls}
        >
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {/* Monto */}
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Monto</label>
        <input
          type="number"
          name="monto"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          className={inputCls}
          required
        />
      </div>

      {/* Moneda origen */}
      <div className={`grid gap-3 ${tipo !== "LP" ? "grid-cols-2" : "grid-cols-1"}`}>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Moneda origen</label>
          <select
            name="monedaOrigen"
            value={monedaOrigen}
            onChange={(e) => setMonedaOrigen(e.target.value)}
            className={inputCls}
          >
            {monedas.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {tipo !== "LP" && (
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Moneda destino</label>
            <select
              name="monedaDestino"
              value={monedaDestino}
              onChange={(e) => setMonedaDestino(e.target.value)}
              className={inputCls}
            >
              {monedas.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Hidden monedaDestino for LP */}
      {tipo === "LP" && <input type="hidden" name="monedaDestino" value="" />}

      {/* Tipo-specific fields */}
      {(tipo === "RULO" || tipo === "LP") && (
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Tasa {tipo === "LP" ? "anual (%)" : "(%)"}</label>
          <input
            type="number"
            name="tasa"
            step="0.01"
            min="0"
            placeholder="5.00"
            value={tasa}
            onChange={(e) => setTasa(e.target.value)}
            className={inputCls}
          />
        </div>
      )}

      {tipo === "DIVISA" && (
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Tipo de cambio</label>
          <input
            type="number"
            name="tipoCambio"
            step="0.01"
            min="0"
            placeholder="975.00"
            value={tipoCambio}
            onChange={(e) => setTipoCambio(e.target.value)}
            className={inputCls}
          />
        </div>
      )}

      {tipo === "LP" && (
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Plazo (días)</label>
          <input
            type="number"
            name="plazoDias"
            step="1"
            min="1"
            placeholder="30"
            value={plazo}
            onChange={(e) => setPlazo(e.target.value)}
            className={inputCls}
          />
        </div>
      )}

      {/* Preview */}
      <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 flex flex-col gap-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resultado estimado</p>
        <p className="text-2xl font-black text-slate-900 tabular-nums">{preview}</p>
      </div>

      {/* Feedback */}
      {state?.error && <p className="text-xs text-red-600 font-semibold">{state.error}</p>}
      {state?.success && state.tipo === "LP" && state.plazoFijoId ? (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex flex-col gap-2">
          <p className="text-xs font-black text-green-700 uppercase tracking-widest">Plazo fijo creado</p>
          <div className="flex flex-col gap-0.5 text-xs text-green-800">
            <span>Capital: <strong>USD {parseFloat(state.capital ?? "0").toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
            <span>Vencimiento: <strong>{new Date(state.fechaVencimiento!).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })}</strong></span>
          </div>
          <Link
            href={`/clientes/${state.clienteId}/pf/${state.plazoFijoId}`}
            className="text-xs font-black text-green-700 hover:text-green-900 underline underline-offset-2 transition-colors w-fit"
          >
            Ver PF →
          </Link>
        </div>
      ) : state?.success ? (
        <p className="text-xs text-green-600 font-semibold">Operación registrada con éxito</p>
      ) : null}
      {readOnlyPreview && <p className="text-xs text-amber-600 font-semibold">Modo lectura activo</p>}

      <button
        type="submit"
        disabled={pending || readOnlyPreview}
        className="bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-lg px-4 py-2.5 hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pending ? "Procesando..." : "Registrar operación"}
      </button>
    </form>
  );
}
