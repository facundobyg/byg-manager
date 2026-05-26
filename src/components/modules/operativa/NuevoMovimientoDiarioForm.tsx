import { useActionState, useEffect, useRef, useState } from "react";
import { crearMovimientoDiario } from "@/app/(dashboard)/operativa/mov-diarios/actions";
import { PlusCircle, Loader2, Info } from "lucide-react";

type Caja = { id: string; label: string };

type Props = {
  cajas: Caja[];
  defaultCajaId?: string;
  defaultClasificacion?: "RESULTADO_OPERATIVO" | "MOVIMIENTO_CAJA" | "TRANSFERENCIA";
};

const init: { error?: string; ok?: boolean } = {};

const SUBTIPOS_RESULTADO = {
  INGRESO: [
    "COMISION", "HONORARIO_CLIENTE", "HONORARIO_BANCO", "RENTA_ALQUILER", "OTRO_INGRESO", "AJUSTE_INGRESO"
  ],
  EGRESO: [
    "ALQUILER", "EXPENSAS", "SUELDO", "MONOTRIBUTO", "LUZ_GAS_CABLE", "HONORARIO_CONTADOR", "COMISION_PAGADA", "IMPUESTO", "OTRO_EGRESO", "AJUSTE_EGRESO"
  ]
};

const SUBTIPOS_CAJA = [
  "INGRESO_CC_CLIENTE",
  "EGRESO_CC_CLIENTE",
  "INGRESO_PF_CLIENTE",
  "EGRESO_PF_CLIENTE",
  "GUARDA_CLIENTE",
  "DEVOLUCION_GUARDA_CLIENTE",
  "PRESTAMO_CLIENTE",
  "DEVOLUCION_PRESTAMO",
  "ADELANTO_FUTURA_OP",
  "DIFERENCIA_LIQUIDACION",
  "AJUSTE_CAJA",
];

const INPUT_CLS = "bg-byg-bg border border-byg-border rounded-xl px-3 py-2 text-sm text-byg-text focus:outline-none focus:ring-1 focus:ring-byg-accent/40";
const LABEL_CLS = "text-[10px] font-black uppercase tracking-widest text-byg-muted";

export function NuevoMovimientoDiarioForm({ cajas, defaultCajaId, defaultClasificacion }: Props) {
  const [state, action, pending] = useActionState(crearMovimientoDiario, init);
  const formRef = useRef<HTMLFormElement>(null);

  const [clasificacion, setClasificacion] = useState<"RESULTADO_OPERATIVO" | "MOVIMIENTO_CAJA" | "TRANSFERENCIA">(defaultClasificacion ?? "MOVIMIENTO_CAJA");
  const [tipo, setTipo] = useState<"ENTRADA" | "SALIDA">("ENTRADA");

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setClasificacion("MOVIMIENTO_CAJA");
      setTipo("ENTRADA");
    }
  }, [state.ok]);

  const subtipos = clasificacion === "RESULTADO_OPERATIVO"
    ? (tipo === "ENTRADA" ? SUBTIPOS_RESULTADO.INGRESO : SUBTIPOS_RESULTADO.EGRESO)
    : SUBTIPOS_CAJA;

  return (
    <section className="bg-byg-surface rounded-2xl border border-byg-border overflow-hidden flex flex-col relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
      <div className="px-6 py-4 border-b border-byg-border bg-byg-bg/40 flex items-center justify-between">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-byg-text flex items-center gap-2">
          <PlusCircle size={14} className="text-emerald-400" />
          Nueva Carga Operativa
        </h2>
        <div className="flex bg-byg-bg p-1 rounded-xl border border-byg-border">
          <button
            type="button"
            onClick={() => setClasificacion("RESULTADO_OPERATIVO")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${clasificacion === "RESULTADO_OPERATIVO" ? "bg-byg-surface text-emerald-400 shadow-sm" : "text-byg-muted hover:text-byg-text"}`}
          >
            Resultado
          </button>
          <button
            type="button"
            onClick={() => setClasificacion("MOVIMIENTO_CAJA")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${clasificacion === "MOVIMIENTO_CAJA" ? "bg-byg-surface text-byg-accent shadow-sm" : "text-byg-muted hover:text-byg-text"}`}
          >
            Solo Caja
          </button>
          <button
            type="button"
            onClick={() => setClasificacion("TRANSFERENCIA")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${clasificacion === "TRANSFERENCIA" ? "bg-byg-surface text-amber-400 shadow-sm" : "text-byg-muted hover:text-byg-text"}`}
          >
            Transferencia
          </button>
        </div>
      </div>

      <form ref={formRef} action={action} className="p-6 flex flex-col gap-6">
        <input type="hidden" name="clasificacion" value={clasificacion} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
          {/* Caja */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLS}>
              {clasificacion === "TRANSFERENCIA" ? "Caja Origen" : "Caja Impactada"}
            </label>
            <select name="cajaId" required defaultValue={defaultCajaId || ""} className={INPUT_CLS}>
              <option value="">Oficina</option>
              {cajas.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {clasificacion === "TRANSFERENCIA" ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-amber-400">Caja Destino</label>
              <select
                name="cajaDestinoId"
                required
                className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 text-sm text-byg-text focus:outline-none focus:ring-1 focus:ring-amber-400/40"
              >
                <option value="">Seleccionar destino...</option>
                {cajas.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <label className={LABEL_CLS}>Dirección</label>
                <select
                  name="tipo"
                  required
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as "ENTRADA" | "SALIDA")}
                  className={`${INPUT_CLS} font-bold`}
                >
                  <option value="ENTRADA">INGRESO (+)</option>
                  <option value="SALIDA">EGRESO (-)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={LABEL_CLS}>Clasificación</label>
                <select
                  name="subtipoOperativo"
                  required
                  className={`${INPUT_CLS} text-[11px] font-bold uppercase`}
                >
                  <option value="">Seleccionar tipo...</option>
                  {subtipos.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
            </>
          )}

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

          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLS}>Moneda</label>
            <select name="moneda" required className={INPUT_CLS}>
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
              <option value="EUR">EUR</option>
              <option value="BRL">BRL</option>
              <option value="USDT">USDT</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLS}>Monto</label>
            <input
              name="monto"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              className={`${INPUT_CLS} font-bold tabular-nums font-mono [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`}
            />
          </div>

          <div className="xl:col-span-6 flex flex-col gap-1.5">
            <label className={LABEL_CLS}>Descripción detallada</label>
            <input
              name="descripcion"
              type="text"
              required
              placeholder="Ej: Pago de alquiler oficina marzo..."
              className={`${INPUT_CLS} px-4 py-3 placeholder:text-byg-muted/50`}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className={`p-4 rounded-xl flex items-center gap-3 border ${
            clasificacion === "RESULTADO_OPERATIVO"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : clasificacion === "TRANSFERENCIA"
              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
              : "bg-byg-accent/10 border-byg-accent/20 text-byg-accent"
          }`}>
            <Info size={16} />
            <p className="text-[11px] font-bold uppercase tracking-tight">
              {clasificacion === "RESULTADO_OPERATIVO"
                ? "Atención: Este movimiento impacta simultáneamente en CAJA y en la UTILIDAD MENSUAL."
                : clasificacion === "TRANSFERENCIA"
                ? "Información: Las transferencias solo mueven saldos entre cajas. NO afectan resultados."
                : "Aviso: Este movimiento solo afecta el saldo de CAJA. No influye en los resultados operativos."}
            </p>
          </div>

          <button
            type="submit"
            disabled={pending}
            className={`w-full text-white text-xs font-black uppercase tracking-[0.2em] py-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 ${
              clasificacion === "RESULTADO_OPERATIVO"
                ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                : clasificacion === "TRANSFERENCIA"
                ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/20"
                : "bg-byg-accent hover:bg-blue-500 shadow-blue-600/20"
            }`}
          >
            {pending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <PlusCircle size={16} />
                {clasificacion === "RESULTADO_OPERATIVO"
                  ? "Registrar Resultado Operativo"
                  : clasificacion === "TRANSFERENCIA"
                  ? "Ejecutar Transferencia"
                  : "Registrar Movimiento de Caja"}
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
              ✓ Operación registrada con éxito
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
