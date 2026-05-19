"use client";

import { useActionState, useState } from "react";
import { concertarOperacion } from "@/app/(dashboard)/bolsa/actions";
import { CheckCircle2 } from "lucide-react";

type Props = {
  operacionId:    string;
  estado:         string;
  tipoOperacion:  string;
  // Pre-fill defaults
  nroBoleto?:         string | null;
  alyc?:              string | null;
  fechaConcertacion?: string | null;
  fechaLiquidacion?:  string | null;
  comisionPct?:       number | null;
  comisionFija?:      number | null;
  derechosMercado?:   number | null;
  gastos?:            number | null;
  impuestos?:         number | null;
  tcMepDia?:          number | null;
  comisionUSD?:       number | null;
  esSenebi?:          boolean | null;
  senebiBruto?:       number | null;
  diasCaucion?:       number | null;
  tasaCaucion?:       number | null;
};

const INPUT_CLS = "w-full px-3 py-2 text-[12px] border border-byg-border rounded-lg bg-byg-bg focus:outline-none focus:ring-1 focus:ring-byg-accent/40 text-byg-text [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
const LABEL_CLS = "block text-[10px] font-black uppercase tracking-widest text-byg-muted mb-1";

function numDefault(v: number | null | undefined) {
  return v != null ? String(v) : "";
}

export function ConcertarForm({
  operacionId, estado, tipoOperacion,
  nroBoleto, alyc, fechaConcertacion, fechaLiquidacion,
  comisionPct, comisionFija, derechosMercado, gastos, impuestos,
  tcMepDia, comisionUSD, esSenebi, senebiBruto, diasCaucion, tasaCaucion,
}: Props) {
  const [state, action, pending] = useActionState(concertarOperacion, null);
  const [isSenebi, setIsSenebi] = useState<boolean>(esSenebi ?? false);

  const isCaucion = tipoOperacion === "CAUCION_COLOCADORA" || tipoOperacion === "CAUCION_TOMADORA";
  const isEditing = estado === "CONCERTADA";
  const title = isEditing ? "Editar concertación" : "Revisar y concertar operación";

  return (
    <section className="bg-byg-surface rounded-2xl border border-byg-border overflow-hidden">
      <div className="px-6 py-4 border-b border-byg-border flex items-center justify-between">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-byg-text">{title}</h2>
        {isEditing && (
          <span className="text-[9px] font-black px-2 py-0.5 rounded bg-byg-accent/10 text-byg-accent ring-1 ring-byg-accent/20 uppercase tracking-widest">
            Editable
          </span>
        )}
      </div>

      <form action={action} className="px-6 py-5 flex flex-col gap-4">
        <input type="hidden" name="operacionId" value={operacionId} />

        {/* Boleto + ALYC */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>N° Boleto / Comprobante</label>
            <input type="text" name="nroBoleto" defaultValue={nroBoleto ?? ""} placeholder="—" className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>ALYC</label>
            <input type="text" name="alyc" defaultValue={alyc ?? ""} placeholder="—" className={INPUT_CLS} />
          </div>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Fecha Concertación</label>
            <input type="date" name="fechaConcertacion" defaultValue={fechaConcertacion ?? ""} className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Fecha Liquidación</label>
            <input type="date" name="fechaLiquidacion" defaultValue={fechaLiquidacion ?? ""} className={INPUT_CLS} />
          </div>
        </div>

        {/* Comisiones */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Comisión %</label>
            <input type="number" name="comisionPct" defaultValue={numDefault(comisionPct)} step="any" min="0" placeholder="0.00" className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Comisión Fija</label>
            <input type="number" name="comisionFija" defaultValue={numDefault(comisionFija)} step="any" min="0" placeholder="0.00" className={INPUT_CLS} />
          </div>
        </div>

        {/* Gastos */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Derechos Mercado</label>
            <input type="number" name="derechosMercado" defaultValue={numDefault(derechosMercado)} step="any" min="0" placeholder="0.00" className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Gastos</label>
            <input type="number" name="gastos" defaultValue={numDefault(gastos)} step="any" min="0" placeholder="0.00" className={INPUT_CLS} />
          </div>
        </div>

        {/* Impuestos + TC MEP */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Impuestos</label>
            <input type="number" name="impuestos" defaultValue={numDefault(impuestos)} step="any" min="0" placeholder="0.00" className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>TC MEP Real</label>
            <input type="number" name="tcMepDia" defaultValue={numDefault(tcMepDia)} step="any" min="0" placeholder="0.0000" className={INPUT_CLS} />
          </div>
        </div>

        {/* Comisión USD */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Comisión USD</label>
            <input type="number" name="comisionUSD" defaultValue={numDefault(comisionUSD)} step="any" min="0" placeholder="0.00" className={INPUT_CLS} />
          </div>
          <div />
        </div>

        {/* SENEBI */}
        <div className="flex flex-col gap-3 rounded-xl border border-byg-border bg-byg-surface-2 px-4 py-3">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              name="esSenebi"
              value="true"
              checked={isSenebi}
              onChange={(e) => setIsSenebi(e.target.checked)}
              className="w-4 h-4 rounded border-byg-border accent-byg-accent"
            />
            <span className="text-[11px] font-black uppercase tracking-widest text-byg-text">
              Comisión SENEBI
            </span>
          </label>
          {isSenebi && (
            <div>
              <label className={LABEL_CLS}>SENEBI Bruto (ARS)</label>
              <input
                type="number"
                name="senebiBruto"
                defaultValue={numDefault(senebiBruto)}
                step="any"
                min="0"
                placeholder="0.00"
                className={INPUT_CLS}
              />
            </div>
          )}
        </div>

        {/* Caución — condicional */}
        {isCaucion && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Días Caución</label>
              <input type="number" name="diasCaucion" defaultValue={diasCaucion ?? ""} step="1" min="0" placeholder="1" className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Tasa Caución %</label>
              <input type="number" name="tasaCaucion" defaultValue={numDefault(tasaCaucion)} step="any" min="0" placeholder="0.0000" className={INPUT_CLS} />
            </div>
          </div>
        )}

        {state && "error" in state && (
          <p className="text-[11px] text-rose-400 font-semibold">{state.error}</p>
        )}

        {state && "ok" in state && state.ok && (
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 size={14} />
            <span className="text-[11px] font-black uppercase tracking-wider">Guardado</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 text-[11px] font-black px-5 py-2 rounded-lg bg-byg-accent text-white hover:bg-blue-500 transition-colors uppercase tracking-widest disabled:opacity-50 shadow-sm shadow-blue-600/20"
          >
            {pending
              ? "Guardando…"
              : isEditing
              ? "Actualizar Concertación"
              : "Guardar y Concertar →"}
          </button>
        </div>
      </form>
    </section>
  );
}
