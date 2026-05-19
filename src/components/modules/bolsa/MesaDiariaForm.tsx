"use client";

import { useActionState, useEffect, useState } from "react";
import { crearOpMesaDiaria } from "@/app/(dashboard)/bolsa/actions";
import { ChevronDown, ChevronUp, PlusCircle } from "lucide-react";

type Comitente = { id: string; nombre: string; nroComitente: string };
type Cartera   = { id: string; nombre: string };

type Props = {
  comitentes:   Comitente[];
  carteras:     Cartera[];
  defaultFecha: string;
};

const TIPO_OPTS = [
  { v: "COMPRA_BONO",        l: "Compra Bono" },
  { v: "VENTA_BONO",         l: "Venta Bono" },
  { v: "COMPRA_ACCION",      l: "Compra Acción" },
  { v: "VENTA_ACCION",       l: "Venta Acción" },
  { v: "COMPRA_CEDEAR",      l: "Compra CEDEAR" },
  { v: "VENTA_CEDEAR",       l: "Venta CEDEAR" },
  { v: "CAUCION_COLOCADORA", l: "Caución Coloc." },
  { v: "CAUCION_TOMADORA",   l: "Caución Tomad." },
  { v: "FUTURO",             l: "Futuro" },
  { v: "OPCION_CALL",        l: "Opción Call" },
  { v: "OPCION_PUT",         l: "Opción Put" },
] as const;

const CAUCION_TIPOS = new Set(["CAUCION_COLOCADORA", "CAUCION_TOMADORA"]);

const inputCls =
  "w-full px-3 py-2 text-[12px] bg-byg-bg border border-byg-border rounded-lg text-byg-text placeholder:text-byg-muted/50 focus:outline-none focus:ring-1 focus:ring-byg-accent/40";
const labelCls = "text-[10px] font-bold uppercase tracking-widest text-byg-muted mb-1 block";

export function MesaDiariaForm({ comitentes, carteras, defaultFecha }: Props) {
  const [state, action, pending] = useActionState(crearOpMesaDiaria, null);
  const [formKey,          setFormKey]          = useState(0);
  const [sujetoTipo,       setSujetoTipo]       = useState<"cartera" | "comitente">("cartera");
  const [tipo,             setTipo]             = useState("COMPRA_BONO");
  const [expanded,         setExpanded]         = useState(true);
  const [comitenteSearch,  setComitenteSearch]  = useState("");

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      setFormKey((k) => k + 1);
    }
  }, [state]);

  const isCaucion = CAUCION_TIPOS.has(tipo);

  return (
    <div className="bg-byg-surface rounded-2xl border border-byg-border overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-5 py-3 border-b border-byg-border bg-byg-bg flex items-center justify-between hover:bg-byg-surface-2 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <PlusCircle size={14} className="text-byg-accent" />
          <span className="text-[11px] font-black uppercase tracking-widest text-byg-text">
            Cargar operación
          </span>
        </div>
        {expanded ? <ChevronUp size={14} className="text-byg-muted" /> : <ChevronDown size={14} className="text-byg-muted" />}
      </button>

      {expanded && (
        <form key={formKey} action={action} className="p-5 flex flex-col gap-4">
          {/* Sujeto toggle */}
          <div className="flex items-center gap-3">
            <span className={labelCls + " mb-0 whitespace-nowrap"}>Tipo cuenta</span>
            <div className="flex rounded-lg overflow-hidden border border-byg-border text-[11px] font-black uppercase tracking-widest">
              {(["cartera", "comitente"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setSujetoTipo(t); setComitenteSearch(""); }}
                  className={`px-3 py-1.5 transition-colors ${
                    sujetoTipo === t
                      ? "bg-byg-accent text-white"
                      : "bg-byg-bg text-byg-muted hover:bg-byg-surface-2"
                  }`}
                >
                  {t === "cartera" ? "Propias" : "Clientes"}
                </button>
              ))}
            </div>
          </div>

          <input type="hidden" name="sujetoTipo" value={sujetoTipo} />

          {/* Row 1: Sujeto + Tipo + Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>
                {sujetoTipo === "cartera" ? "Cartera" : "Comitente"}
              </label>
              {sujetoTipo === "cartera" ? (
                <select name="carteraId" className={inputCls} required>
                  <option value="">Seleccionar…</option>
                  {carteras.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Buscar por nombre o N° comitente…"
                    value={comitenteSearch}
                    onChange={(e) => setComitenteSearch(e.target.value)}
                    className={inputCls + " mb-1"}
                  />
                  <select name="comitenteId" className={inputCls} required>
                    <option value="">Seleccionar…</option>
                    {comitentes
                      .filter((c) => {
                        const q = comitenteSearch.toLowerCase();
                        return (
                          c.nombre.toLowerCase().includes(q) ||
                          c.nroComitente.includes(comitenteSearch)
                        );
                      })
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} ({c.nroComitente})
                        </option>
                      ))}
                  </select>
                </>
              )}
            </div>

            <div>
              <label className={labelCls}>Tipo operación</label>
              <select
                name="tipoOperacion"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className={inputCls}
                required
              >
                {TIPO_OPTS.map((o) => (
                  <option key={o.v} value={o.v}>{o.l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Fecha operativa</label>
              <input
                type="date"
                name="fechaOperativa"
                defaultValue={defaultFecha}
                className={inputCls}
              />
            </div>
          </div>

          {/* Row 2: Ticker + Cantidad + Precio + Moneda + Mercado */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className={labelCls}>
                Ticker{isCaucion ? " (opcional)" : ""}
              </label>
              <input
                type="text"
                name="ticker"
                placeholder={isCaucion ? "CAUCION" : "Ej: AL30"}
                className={inputCls + " uppercase"}
                required={!isCaucion}
              />
            </div>

            <div>
              <label className={labelCls}>Cantidad</label>
              <input
                type="number"
                name="cantidad"
                placeholder="0"
                min="0.000001"
                step="any"
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className={labelCls}>Precio</label>
              <input
                type="number"
                name="precio"
                placeholder="0.00"
                min="0.000001"
                step="any"
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className={labelCls}>Moneda</label>
              <select name="moneda" className={inputCls} defaultValue="ARS">
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <input type="hidden" name="mercado" value="BYMA" />
          </div>

          {/* Row 3: Resultados estimados */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className={labelCls}>Resultado bruto</label>
              <input
                type="number"
                name="resultadoBruto"
                placeholder="—"
                step="any"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Resultado neto</label>
              <input
                type="number"
                name="resultadoNeto"
                placeholder="—"
                step="any"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>TC MEP día</label>
              <input
                type="number"
                name="tcMepDia"
                placeholder="—"
                step="any"
                className={inputCls}
              />
            </div>

            {isCaucion ? (
              <>
                <div>
                  <label className={labelCls}>Tasa caución %</label>
                  <input
                    type="number"
                    name="tasaCaucion"
                    placeholder="—"
                    step="any"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Días caución</label>
                  <input
                    type="number"
                    name="diasCaucion"
                    placeholder="—"
                    min="1"
                    step="1"
                    className={inputCls}
                  />
                </div>
              </>
            ) : (
              <div>
                <label className={labelCls}>Observaciones</label>
                <input
                  type="text"
                  name="observaciones"
                  placeholder="—"
                  className={inputCls}
                />
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-1.5 text-[11px] font-black px-5 py-2.5 rounded-xl bg-byg-accent text-white hover:bg-blue-500 disabled:opacity-50 transition-colors uppercase tracking-widest shadow-sm shadow-blue-600/20"
            >
              {pending ? "Guardando…" : "Guardar operación"}
            </button>

            {state && "ok" in state && state.ok && (
              <span className="text-[11px] font-semibold text-emerald-400">
                Operación guardada
              </span>
            )}
            {state && "error" in state && state.error && (
              <span className="text-[11px] font-semibold text-red-400">
                {state.error}
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
