"use client";

import { useState, useEffect, useActionState } from "react";
import { crearOperacionBolsa } from "@/app/(dashboard)/bolsa/actions";

type Comitente = { id: string; nombre: string };
type Cartera = { id: string; nombre: string };

type Props = {
  comitentes: Comitente[];
  carteras:   Cartera[];
  tickers:    string[];
};

const TIPOS = [
  { value: "COMPRA_BONO",        label: "Compra Bono" },
  { value: "VENTA_BONO",         label: "Venta Bono" },
  { value: "COMPRA_ACCION",      label: "Compra Acción" },
  { value: "VENTA_ACCION",       label: "Venta Acción" },
  { value: "COMPRA_CEDEAR",      label: "Compra CEDEAR" },
  { value: "VENTA_CEDEAR",       label: "Venta CEDEAR" },
  { value: "CAUCION_COLOCADORA", label: "Caución Colocadora" },
  { value: "CAUCION_TOMADORA",   label: "Caución Tomadora" },
  { value: "FUTURO",             label: "Futuro" },
  { value: "OPCION_CALL",        label: "Opción Call" },
  { value: "OPCION_PUT",         label: "Opción Put" },
  { value: "MEP",                label: "MEP" },
  { value: "SENEBI",             label: "SENEBI" },
];

const MONEDAS = ["ARS", "USD", "EUR", "BRL"];
const MERCADOS = [
  { value: "BYMA",        label: "BYMA" },
  { value: "MAE",         label: "MAE" },
  { value: "SENEBI_OTC",  label: "SENEBI OTC" },
  { value: "MATBA_ROFEX", label: "MATBA-ROFEX" },
  { value: "OTC",         label: "OTC" },
];

const INPUT_CLS = "w-full px-3 py-2 text-[12px] border border-byg-border rounded-lg bg-byg-bg focus:outline-none focus:ring-1 focus:ring-byg-accent/40 text-byg-text [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
const LABEL_CLS = "block text-[10px] font-black uppercase tracking-widest text-byg-muted mb-1";

export function NuevaOpForm({ comitentes, carteras, tickers }: Props) {
  const [sujetoTipo, setSujetoTipo] = useState<"comitente" | "cartera">("comitente");
  const [state, action, pending]   = useActionState(crearOperacionBolsa, null);
  const [cantidad, setCantidad] = useState("");
  const [precio,   setPrecio]   = useState("");
  const netoDisplay = (() => {
    const q = parseFloat(cantidad);
    const p = parseFloat(precio);
    if (!isNaN(q) && !isNaN(p) && q > 0 && p > 0)
      return (q * p).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return null;
  })();

  useEffect(() => {
    if (state && "ok" in state && state.ok && state.id) {
      window.location.href = `/bolsa/${state.id}`;
    }
  }, [state]);

  return (
    <div className="bg-byg-surface rounded-2xl border border-byg-border p-6">
      <h2 className="text-[11px] font-black uppercase tracking-widest text-byg-muted mb-5">
        Nueva Operación
      </h2>

      <form action={action} className="flex flex-col gap-4">
        {/* Sujeto tipo */}
        <div>
          <p className={LABEL_CLS}>Cuenta</p>
          <div className="flex gap-3">
            {(["comitente", "cartera"] as const).map((t) => (
              <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="sujetoTipo"
                  value={t}
                  checked={sujetoTipo === t}
                  onChange={() => setSujetoTipo(t)}
                  className="accent-blue-600"
                />
                <span className="text-[12px] font-semibold text-byg-text capitalize">
                  {t === "comitente" ? "Comitente" : "Cartera Propia"}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Comitente/Cartera + Tipo Operación */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLS}>
              {sujetoTipo === "comitente" ? "Comitente / Cuenta de Inversión" : "Cartera"}
            </label>
            {sujetoTipo === "comitente" ? (
              <select name="comitenteId" required className={INPUT_CLS}>
                <option value="">— Seleccionar comitente —</option>
                {comitentes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            ) : (
              <select name="carteraId" required className={INPUT_CLS}>
                <option value="">— Seleccionar cartera —</option>
                {carteras.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            )}
            {sujetoTipo === "comitente"
              ? <input type="hidden" name="carteraId" value="" />
              : <input type="hidden" name="comitenteId" value="" />}
          </div>
          <div>
            <label className={LABEL_CLS}>Tipo Operación</label>
            <select name="tipoOperacion" required className={INPUT_CLS}>
              <option value="">— Tipo —</option>
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Ticker + Fecha Operativa */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLS}>Ticker</label>
            <input
              type="text"
              name="ticker"
              list="ticker-datalist"
              required
              placeholder="AL30, GGAL…"
              className={INPUT_CLS}
              style={{ textTransform: "uppercase" }}
            />
            <datalist id="ticker-datalist">
              {tickers.map((t) => <option key={t} value={t} />)}
            </datalist>
          </div>
          <div>
            <label className={LABEL_CLS}>Fecha Operativa <span className="text-byg-muted/60 normal-case tracking-normal font-normal">(opcional)</span></label>
            <input
              type="date"
              name="fechaOperativa"
              className={INPUT_CLS}
            />
          </div>
        </div>

        {/* Cantidad + Precio */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLS}>Cantidad</label>
            <input
              type="number"
              name="cantidad"
              required
              min="0"
              step="any"
              placeholder="0"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className={LABEL_CLS}>Precio</label>
            <input
              type="number"
              name="precio"
              required
              min="0"
              step="any"
              placeholder="0.00"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              className={INPUT_CLS}
            />
          </div>
        </div>
        {netoDisplay && (
          <p className="text-[10px] text-byg-muted font-mono -mt-2">
            Neto estimado: <strong className="text-byg-text">{netoDisplay}</strong>
          </p>
        )}

        {/* Moneda + Mercado */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLS}>Moneda</label>
            <select name="moneda" required className={INPUT_CLS}>
              {MONEDAS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL_CLS}>Mercado</label>
            <select name="mercado" required className={INPUT_CLS}>
              {MERCADOS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Observaciones */}
        <div>
          <label className={LABEL_CLS}>Observaciones (opcional)</label>
          <textarea
            name="observaciones"
            rows={2}
            placeholder="Notas internas…"
            className={`${INPUT_CLS} resize-none`}
          />
        </div>

        {state && "error" in state && (
          <p className="text-[11px] text-rose-400 font-semibold">{state.error}</p>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <a
            href="/bolsa"
            className="text-[11px] font-bold px-3 py-2 rounded-lg bg-byg-surface-2 text-byg-muted hover:bg-byg-border border border-byg-border transition-colors"
          >
            Cancelar
          </a>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 text-[11px] font-black px-4 py-2 rounded-lg bg-byg-accent text-white hover:bg-blue-500 transition-colors uppercase tracking-widest disabled:opacity-50 shadow-sm shadow-blue-600/20"
          >
            {pending ? "Cargando…" : "Cargar Operación →"}
          </button>
        </div>
      </form>
    </div>
  );
}
