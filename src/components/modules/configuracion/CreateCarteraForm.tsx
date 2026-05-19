"use client";

import { useActionState, useState } from "react";
import { createCartera } from "@/app/(dashboard)/configuracion/actions";
import { TipoCartera } from "@prisma/client";
import { Plus } from "lucide-react";

const iCls =
  "text-[12px] font-bold text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full";

const init: { error?: string; ok?: boolean } = {};

export function CreateCarteraForm() {
  const [state, action, pending] = useActionState(createCartera, init);
  const [tipoVal, setTipoVal]   = useState<TipoCartera>("COMPLETA");
  const isCripto = tipoVal === "CRIPTO";

  return (
    <form action={action} className="flex flex-wrap items-center gap-2 px-6 py-3 bg-slate-50/40 border-t border-slate-100">
      <input
        name="nombre"
        type="text"
        required
        placeholder="Nombre"
        className={iCls + " w-32"}
      />
      <input
        name="slug"
        type="text"
        required
        placeholder="slug"
        className={iCls + " w-28 font-mono"}
      />
      <select
        name="tipo"
        value={tipoVal}
        onChange={(e) => setTipoVal(e.target.value as TipoCartera)}
        className={iCls + " w-28"}
      >
        <option value="COMPLETA">COMPLETA</option>
        <option value="CRIPTO">CRIPTO</option>
      </select>

      <input
        name="comitenteNumber"
        type="text"
        placeholder="Nro comitente"
        disabled={isCripto}
        className={iCls + " w-28" + (isCripto ? " opacity-40 cursor-not-allowed" : "")}
      />
      <input
        name="investmentAccountType"
        type="text"
        placeholder="Tipo cuenta"
        disabled={isCripto}
        className={iCls + " w-24" + (isCripto ? " opacity-40 cursor-not-allowed" : "")}
      />
      <label className={`flex items-center gap-1.5 text-[11px] font-bold text-slate-600 cursor-pointer ${isCripto ? "opacity-40 cursor-not-allowed" : ""}`}>
        <input
          type="checkbox"
          name="mirrorInInvestmentAccounts"
          value="true"
          disabled={isCripto}
          className="w-3.5 h-3.5 rounded border-slate-300 accent-blue-500"
        />
        Espejo BI
      </label>

      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase rounded-lg bg-emerald-700 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
      >
        <Plus size={12} />
        {pending ? "…" : "Agregar"}
      </button>

      {state.error && <span className="text-[10px] font-bold text-rose-600">{state.error}</span>}
      {state.ok    && <span className="text-[10px] font-bold text-emerald-600">✓ Creada</span>}
    </form>
  );
}
