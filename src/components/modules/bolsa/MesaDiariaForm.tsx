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
  tcMepDefault?: number | null;
};

// ── Mapeo instrumento + dirección → TipoOpBolsa ──────────────────────────────
const INSTRUMENTO_OPTS = [
  { v: "BONO",     l: "Bono" },
  { v: "ACCION",   l: "Acción" },
  { v: "CEDEAR",   l: "CEDEAR" },
  { v: "CAUCION",  l: "Caución" },
  { v: "FUTURO",   l: "Futuro" },
  { v: "OPCIONES", l: "Opciones" },
] as const;

type Instrumento = typeof INSTRUMENTO_OPTS[number]["v"];

const DIRECCION_OPTS: Record<Instrumento, { v: string; l: string }[]> = {
  BONO:     [{ v: "COMPRA", l: "Compra" }, { v: "VENTA", l: "Venta" }],
  ACCION:   [{ v: "COMPRA", l: "Compra" }, { v: "VENTA", l: "Venta" }],
  CEDEAR:   [{ v: "COMPRA", l: "Compra" }, { v: "VENTA", l: "Venta" }],
  CAUCION:  [{ v: "COLOCADORA", l: "Colocadora" }, { v: "TOMADORA", l: "Tomadora" }],
  FUTURO:   [],
  OPCIONES: [{ v: "CALL", l: "Call" }, { v: "PUT", l: "Put" }],
};

function toTipoOp(instrumento: Instrumento, direccion: string): string {
  switch (instrumento) {
    case "BONO":     return direccion === "VENTA"     ? "VENTA_BONO"          : "COMPRA_BONO";
    case "ACCION":   return direccion === "VENTA"     ? "VENTA_ACCION"        : "COMPRA_ACCION";
    case "CEDEAR":   return direccion === "VENTA"     ? "VENTA_CEDEAR"        : "COMPRA_CEDEAR";
    case "CAUCION":  return direccion === "TOMADORA"  ? "CAUCION_TOMADORA"    : "CAUCION_COLOCADORA";
    case "FUTURO":   return "FUTURO";
    case "OPCIONES": return direccion === "PUT"       ? "OPCION_PUT"          : "OPCION_CALL";
    default:         return "COMPRA_BONO";
  }
}

const CAUCION_TIPOS = new Set(["CAUCION_COLOCADORA", "CAUCION_TOMADORA"]);

const iCls =
  "w-full px-3 py-2 text-[12px] bg-byg-bg border border-byg-border rounded-lg text-byg-text placeholder:text-byg-muted/50 focus:outline-none focus:ring-1 focus:ring-byg-accent/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
const lCls = "text-[10px] font-bold uppercase tracking-widest text-byg-muted mb-1 block";

export function MesaDiariaForm({ comitentes, carteras, defaultFecha, tcMepDefault }: Props) {
  const [state, action, pending] = useActionState(crearOpMesaDiaria, null);
  const [formKey,         setFormKey]         = useState(0);
  const [sujetoTipo,      setSujetoTipo]      = useState<"cartera" | "comitente">("cartera");
  const [instrumento,     setInstrumento]     = useState<Instrumento>("BONO");
  const [direccion,       setDireccion]       = useState("COMPRA");
  const [expanded,        setExpanded]        = useState(true);
  const [comitenteSearch, setComitenteSearch] = useState("");
  const [tcMep,           setTcMep]           = useState(tcMepDefault != null ? String(tcMepDefault) : "");

  const [cantidad, setCantidad] = useState("");
  const [precio,   setPrecio]   = useState("");
  const [neto,     setNeto]     = useState("");

  function handleCantidadChange(v: string) {
    setCantidad(v);
    const q = parseFloat(v), p = parseFloat(precio), n = parseFloat(neto);
    if (!isNaN(q) && q > 0) {
      if (!isNaN(p) && p > 0) setNeto((q * p).toFixed(2));
      else if (!isNaN(n) && n > 0) setPrecio((n / q).toFixed(6));
    }
  }
  function handlePrecioChange(v: string) {
    setPrecio(v);
    const q = parseFloat(cantidad), p = parseFloat(v);
    if (!isNaN(q) && !isNaN(p) && q > 0 && p > 0) setNeto((q * p).toFixed(2));
  }
  function handleNetoChange(v: string) {
    setNeto(v);
    const q = parseFloat(cantidad), n = parseFloat(v);
    if (!isNaN(q) && !isNaN(n) && q > 0 && n > 0) setPrecio((n / q).toFixed(6));
  }

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      setFormKey((k) => k + 1);
      setCantidad("");
      setPrecio("");
      setNeto("");
    }
  }, [state]);

  useEffect(() => {
    const opts = DIRECCION_OPTS[instrumento];
    if (opts.length > 0) setDireccion(opts[0].v);
    else setDireccion("");
  }, [instrumento]);

  const tipoOp    = toTipoOp(instrumento, direccion);
  const isCaucion = CAUCION_TIPOS.has(tipoOp);
  const direccionOpts = DIRECCION_OPTS[instrumento];

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

          {/* ── TC MEP + carga completa (banner superior) ── */}
          <div className="flex items-center gap-3 bg-byg-surface-2 rounded-xl px-4 py-2.5 border border-byg-border/60">
            <span className="text-[10px] font-black uppercase tracking-widest text-byg-muted whitespace-nowrap">
              TC MEP día
            </span>
            <input
              type="number"
              name="tcMepDia"
              value={tcMep}
              onChange={(e) => setTcMep(e.target.value)}
              step="any"
              min="0"
              placeholder="—"
              className="w-32 px-2.5 py-1.5 text-[12px] bg-byg-bg border border-byg-border rounded-lg text-byg-text focus:outline-none focus:ring-1 focus:ring-byg-accent/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
            {tcMepDefault != null && (
              <span className="text-[10px] text-byg-muted hidden sm:inline">
                último: {tcMepDefault.toLocaleString("es-AR")}
              </span>
            )}
          </div>

          {/* Sujeto toggle */}
          <div className="flex items-center gap-3">
            <span className={lCls + " mb-0 whitespace-nowrap"}>Tipo cuenta</span>
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
          <input type="hidden" name="tipoOperacion" value={tipoOp} />

          {/* ── ROW 1: Cartera/Comitente | Instrumento | Operación | Fecha ── */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-start">
            {/* Sujeto (con search inline en comitente) */}
            <div className="flex flex-col gap-1">
              <label className={lCls}>
                {sujetoTipo === "cartera" ? "Cartera" : "Comitente"}
              </label>
              {sujetoTipo === "cartera" ? (
                <select name="carteraId" className={iCls} required>
                  <option value="">Seleccionar…</option>
                  {carteras.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              ) : (
                <>
                  <input
                    type="text"
                    value={comitenteSearch}
                    onChange={(e) => setComitenteSearch(e.target.value)}
                    placeholder="Filtrar…"
                    className="w-full px-2.5 py-1 text-[11px] bg-byg-bg border border-byg-border rounded-md text-byg-text placeholder:text-byg-muted/50 focus:outline-none focus:ring-1 focus:ring-byg-accent/30"
                  />
                  <select name="comitenteId" className={iCls} required>
                    <option value="">Seleccionar…</option>
                    {comitentes
                      .filter((c) => {
                        if (!comitenteSearch) return true;
                        const q = comitenteSearch.toLowerCase();
                        return c.nombre.toLowerCase().includes(q) || c.nroComitente.includes(comitenteSearch);
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

            {/* Instrumento */}
            <div className="flex flex-col gap-1">
              <label className={lCls}>Instrumento</label>
              <select
                value={instrumento}
                onChange={(e) => setInstrumento(e.target.value as Instrumento)}
                className={iCls}
              >
                {INSTRUMENTO_OPTS.map((o) => (
                  <option key={o.v} value={o.v}>{o.l}</option>
                ))}
              </select>
            </div>

            {/* Dirección */}
            <div className="flex flex-col gap-1">
              <label className={lCls}>Operación</label>
              {direccionOpts.length > 0 ? (
                <select
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className={iCls}
                >
                  {direccionOpts.map((o) => (
                    <option key={o.v} value={o.v}>{o.l}</option>
                  ))}
                </select>
              ) : (
                <div className={iCls + " text-byg-muted/50 cursor-default"}>—</div>
              )}
            </div>

            {/* Fecha */}
            <div className="flex flex-col gap-1">
              <label className={lCls}>Fecha operativa</label>
              <input type="date" name="fechaOperativa" defaultValue={defaultFecha} className={iCls} />
            </div>
          </div>

          {/* ── ROW 2: Ticker | Moneda | Cantidad | Precio | Neto ── */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-start">
            <div className="flex flex-col gap-1">
              <label className={lCls}>
                Ticker{isCaucion ? " (opc.)" : ""}
              </label>
              <input
                type="text"
                name="ticker"
                placeholder={isCaucion ? "CAUCION" : "AL30, GGAL…"}
                className={iCls + " uppercase"}
                required={!isCaucion}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={lCls}>Moneda</label>
              <select name="moneda" className={iCls} defaultValue="ARS">
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className={lCls}>Cantidad</label>
              <input
                type="number"
                name="cantidad"
                value={cantidad}
                onChange={(e) => handleCantidadChange(e.target.value)}
                placeholder="0"
                min="0.000001"
                step="any"
                className={iCls}
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={lCls}>Precio</label>
              <input
                type="number"
                name="precio"
                value={precio}
                onChange={(e) => handlePrecioChange(e.target.value)}
                placeholder="0.00"
                min="0.000001"
                step="any"
                className={iCls}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lCls}>Neto / Resultado</label>
              <input
                type="number"
                name="resultadoNeto"
                value={neto}
                onChange={(e) => handleNetoChange(e.target.value)}
                placeholder="0.00"
                min="0"
                step="any"
                className={iCls}
              />
            </div>
          </div>

          <input type="hidden" name="mercado" value="BYMA" />

          {/* ── ROW 3: Obs ── */}
          <div className="flex flex-col gap-1">
            <label className={lCls}>Observaciones</label>
            <input type="text" name="observaciones" placeholder="—" className={iCls} />
          </div>

          {/* Caución */}
          {isCaucion && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lCls}>Tasa caución %</label>
                <input type="number" name="tasaCaucion" placeholder="—" step="any" className={iCls} />
              </div>
              <div>
                <label className={lCls}>Días caución</label>
                <input type="number" name="diasCaucion" placeholder="—" min="1" step="1" className={iCls} />
              </div>
            </div>
          )}

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
              <span className="text-[11px] font-semibold text-emerald-500">Operación guardada</span>
            )}
            {state && "error" in state && state.error && (
              <span className="text-[11px] font-semibold text-rose-500">{state.error}</span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
