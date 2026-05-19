"use client";

import { useRouter } from "next/navigation";

type Option = { value: string; label: string };

type Props = {
  basePath:   string;
  productor:  string;
  mes:        string;
  clienteId:  string;
  estado:     string;
  tipo:       string;
  clientes:   Option[];
};

const SELECT_CLS =
  "text-[11px] font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer";
const LABEL_CLS = "text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5";

export function ReportesFilters({
  basePath, productor, mes, clienteId, estado, tipo, clientes,
}: Props) {
  const router = useRouter();

  function update(key: string, value: string) {
    const p = new URLSearchParams({ tab: "reportes", productor, mes, clienteId, estado, tipo });
    p.set(key, value);
    router.push(`${basePath}?${p.toString()}`);
  }

  return (
    <div className="flex items-end gap-3 flex-wrap">
      <div className="flex flex-col">
        <label className={LABEL_CLS}>Cliente</label>
        <select value={clienteId} onChange={(e) => update("clienteId", e.target.value)} className={SELECT_CLS}>
          <option value="all">Todos los clientes</option>
          {clientes.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <label className={LABEL_CLS}>Estado</label>
        <select value={estado} onChange={(e) => update("estado", e.target.value)} className={SELECT_CLS}>
          <option value="all">Todas</option>
          <option value="CONCERTADA">Concertadas</option>
          <option value="LIQUIDADA">Liquidadas</option>
        </select>
      </div>

      <div className="flex flex-col">
        <label className={LABEL_CLS}>Tipo</label>
        <select value={tipo} onChange={(e) => update("tipo", e.target.value)} className={SELECT_CLS}>
          <option value="all">Todos</option>
          <option value="bonos">Bonos</option>
          <option value="acciones">Acciones</option>
          <option value="cedear">CEDEAR</option>
          <option value="caucion">Cauciones</option>
          <option value="opciones">Opciones</option>
          <option value="futuros">Futuros</option>
          <option value="mep">MEP / SENEBI</option>
        </select>
      </div>
    </div>
  );
}
