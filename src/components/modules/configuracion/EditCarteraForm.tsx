"use client";

import { useActionState, useState } from "react";
import { updateCartera } from "@/app/(dashboard)/configuracion/actions";
import { TipoCartera } from "@prisma/client";

type Props = {
  id:                         string;
  nombre:                     string;
  slug:                       string;
  tipo:                       TipoCartera;
  comitenteNumber?:           string | null;
  investmentAccountType?:     string | null;
  mirrorInInvestmentAccounts: boolean;
};

const iCls =
  "text-[12px] font-bold text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full";

const init: { error?: string; ok?: boolean } = {};

export function EditCarteraForm({
  id,
  nombre,
  slug,
  tipo,
  comitenteNumber,
  investmentAccountType,
  mirrorInInvestmentAccounts,
}: Props) {
  const [state, action, pending] = useActionState(updateCartera, init);
  const [tipoVal, setTipoVal]   = useState<TipoCartera>(tipo);
  const isCripto = tipoVal === "CRIPTO";

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />

      <input
        name="nombre"
        type="text"
        defaultValue={nombre}
        placeholder="Nombre"
        className={iCls + " w-32"}
      />
      <input
        name="slug"
        type="text"
        defaultValue={slug}
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
        defaultValue={comitenteNumber ?? ""}
        placeholder="Nro comitente"
        disabled={isCripto}
        className={iCls + " w-28" + (isCripto ? " opacity-40 cursor-not-allowed" : "")}
      />
      <input
        name="investmentAccountType"
        type="text"
        defaultValue={investmentAccountType ?? ""}
        placeholder="Tipo cuenta"
        disabled={isCripto}
        className={iCls + " w-24" + (isCripto ? " opacity-40 cursor-not-allowed" : "")}
      />
      <label className={`flex items-center gap-1.5 text-[11px] font-bold text-slate-600 cursor-pointer ${isCripto ? "opacity-40 cursor-not-allowed" : ""}`}>
        <input
          type="checkbox"
          name="mirrorInInvestmentAccounts"
          value="true"
          defaultChecked={mirrorInInvestmentAccounts}
          disabled={isCripto}
          className="w-3.5 h-3.5 rounded border-slate-300 accent-blue-500"
        />
        Espejo BI
      </label>

      <button
        type="submit"
        disabled={pending}
        className="px-3 py-1.5 text-[10px] font-black uppercase rounded-lg bg-slate-900 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
      >
        {pending ? "…" : "Guardar"}
      </button>

      {state.error && <span className="text-[10px] font-bold text-rose-600">{state.error}</span>}
      {state.ok    && <span className="text-[10px] font-bold text-emerald-600">✓ Guardado</span>}
    </form>
  );
}
