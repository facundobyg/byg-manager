"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Pencil, X } from "lucide-react";
import { CategoriaActivo } from "@prisma/client";
import {
  updateActivoMetadata,
  getActivoUsageSummary,
  type ActivoUsageSummary,
} from "@/app/(dashboard)/configuracion/actions";

const CATEGORIES: { value: CategoriaActivo; label: string }[] = [
  { value: "BONO_USD",       label: "Bonos USD (Soberanos)" },
  { value: "ON_USD",         label: "ONs en USD" },
  { value: "ACCION_ARS",     label: "Acciones Argentinas" },
  { value: "ACCION_USD",     label: "Acciones USD (Cable)" },
  { value: "ACCION_USD_EXT", label: "Acciones USD (MEP)" },
  { value: "CEDEAR",         label: "CEDEARs" },
  { value: "FCI",            label: "FCI / Fondos" },
  { value: "CRIPTO",         label: "Cripto" },
  { value: "BONO_ARS",       label: "Bonos ARS" },
];

const iCls = "px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-100 w-full";

type Props = {
  activoId:     string;
  ticker:       string;
  descripcion:  string | null;
  categoria:    CategoriaActivo;
  monedaPrecio: string;
};

export function EditActivoModal({ activoId, ticker, descripcion, categoria, monedaPrecio }: Props) {
  const [open, setOpen] = useState(false);
  const [usage, setUsage] = useState<ActivoUsageSummary | { error: string } | null>(null);
  const [loadingUsage, startLoadUsage] = useTransition();
  const [tickerAdvanced, setTickerAdvanced] = useState(false);
  const [tickerConfirmed, setTickerConfirmed] = useState(false);
  const [state, action, pending] = useActionState(updateActivoMetadata, null);

  useEffect(() => {
    if (open) {
      startLoadUsage(async () => {
        const result = await getActivoUsageSummary(activoId);
        setUsage(result);
      });
    }
  }, [open, activoId]);

  useEffect(() => {
    if (state?.ok) {
      setOpen(false);
      setTickerAdvanced(false);
      setTickerConfirmed(false);
    }
  }, [state]);

  const usageOk = usage && !("error" in usage) ? usage : null;
  const totalUsos = usageOk
    ? usageOk.posiciones.length + usageOk.custodias.length + usageOk.holdings.length
    : 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Editar catálogo"
        className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
      >
        <Pencil size={12} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/30">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-800">
                Editar catálogo — {ticker}
              </p>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X size={14} />
              </button>
            </div>

            <div className="px-5 py-3 border-b border-slate-100 bg-amber-50 text-[11px] text-amber-800">
              {loadingUsage || usage === null ? (
                "Revisando uso de este activo…"
              ) : usageOk ? (
                <>
                  Este activo está usado en <strong>{usageOk.posiciones.length}</strong> cartera(s) propia(s),{" "}
                  <strong>{usageOk.custodias.length}</strong> custodia(s) de clientes,{" "}
                  <strong>{usageOk.holdings.length}</strong> holding(s) de comitentes y tiene{" "}
                  <strong>{usageOk.historicoCount}</strong> registro(s) de precio histórico.
                  {usageOk.aliasEnabled && (
                    <p className="mt-1">Tiene un alias activo de Data912 para este ticker — cambiar el ticker rompería ese matching.</p>
                  )}
                </>
              ) : (
                <span className="text-rose-700">{(usage as { error: string }).error}</span>
              )}
            </div>

            <form action={action} className="p-5 flex flex-col gap-4">
              <input type="hidden" name="activoId" value={activoId} />
              <input type="hidden" name="confirmTickerChange" value={tickerConfirmed ? "true" : "false"} />

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción</label>
                <input name="descripcion" defaultValue={descripcion ?? ""} required className={iCls} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoría</label>
                  <select name="categoria" defaultValue={categoria} required className={iCls}>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Moneda</label>
                  <select name="monedaPrecio" defaultValue={monedaPrecio} required className={iCls}>
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
                {!tickerAdvanced ? (
                  <button
                    type="button"
                    onClick={() => setTickerAdvanced(true)}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 text-left"
                  >
                    Ticker: {ticker} — cambiar (avanzado) ▾
                  </button>
                ) : (
                  <>
                    <label className="text-[10px] font-black uppercase tracking-widest text-rose-500">Ticker (avanzado)</label>
                    <input name="ticker" defaultValue={ticker} required className={iCls} />
                    <label className="flex items-start gap-2 text-[10px] text-rose-600 font-medium mt-1">
                      <input
                        type="checkbox"
                        checked={tickerConfirmed}
                        onChange={(e) => setTickerConfirmed(e.target.checked)}
                        className="mt-0.5"
                      />
                      Entiendo que cambiar el ticker NO actualiza automáticamente aliases de Data912 ni holdings de comitentes que lo referencian como texto libre.
                    </label>
                  </>
                )}
                {!tickerAdvanced && <input type="hidden" name="ticker" value={ticker} />}
              </div>

              {state?.error && <p className="text-[11px] text-rose-600 font-bold">{state.error}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                >
                  {pending ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
