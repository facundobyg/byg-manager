"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { ProductorInversion } from "@prisma/client";
import type { ProductorOption } from "@/lib/services/config.service";
import { editProductorAction } from "@/app/(dashboard)/cuentas-inversion/[id]/comitentes/[comitenteId]/actions";
import { EditComitenteForm }    from "./EditComitenteForm";
import { EditSaldosForm }       from "./EditSaldosForm";
import { DeleteComitenteButton } from "./DeleteComitenteButton";

const PRODUCTOR_LABEL: Record<ProductorInversion, string> = { IPS: "IPS", BYG: "BYG", OTRO: "Otro" };
const PRODUCTOR_CLS: Record<ProductorInversion, string> = {
  IPS:  "bg-violet-50 text-violet-700",
  BYG:  "bg-blue-50 text-blue-700",
  OTRO: "bg-slate-100 text-slate-600",
};

const PRODUCTORES: ProductorInversion[] = ["BYG", "IPS", "OTRO"];

function fmt(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export type ComitenteProp = {
  id: string;
  nroComitente: string;
  nombre: string | null;
  razonSocial: string | null;
  productor: ProductorInversion;
  activo: boolean;
  esPropioBYG: boolean;
  notas: string | null;
  saldoARS: number;
  saldoUSDCable: number;
  saldoUSDMep: number;
  holdingsCount: number;
};

export function ComitentesTableClient({
  comitentes,
  editId,
  editSaldosId,
  baseUrl,
  productores,
  cuentaInversionId,
}: {
  comitentes: ComitenteProp[];
  editId: string | undefined;
  editSaldosId: string | undefined;
  baseUrl: string;
  productores: ProductorOption[];
  cuentaInversionId: string;
}) {
  const [query, setQuery] = useState("");

  // Productor inline edit
  const [productorOverrides, setProductorOverrides] = useState<Record<string, ProductorInversion>>({});
  const [editingProductorId, setEditingProductorId]   = useState<string | null>(null);
  const [pendingProductor, setPendingProductor]       = useState<ProductorInversion>("BYG");
  const [productorError, setProductorError]           = useState<string | null>(null);
  const [saving, startSave]                           = useTransition();

  function openProductorEdit(c: ComitenteProp) {
    setEditingProductorId(c.id);
    setPendingProductor(productorOverrides[c.id] ?? c.productor);
    setProductorError(null);
  }

  function cancelProductorEdit() {
    setEditingProductorId(null);
    setProductorError(null);
  }

  function handleSave() {
    if (!editingProductorId) return;
    const id = editingProductorId;
    startSave(async () => {
      const result = await editProductorAction(id, cuentaInversionId, pendingProductor);
      if (result.error) {
        setProductorError(result.error);
      } else {
        setProductorOverrides((prev) => ({ ...prev, [id]: pendingProductor }));
        setEditingProductorId(null);
        setProductorError(null);
      }
    });
  }

  if (comitentes.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-400 italic">Sin clientes. Usar "Nuevo Comitente" arriba.</p>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const filtered = q
    ? comitentes.filter(
        (c) =>
          c.nroComitente.toLowerCase().includes(q) ||
          (c.nombre?.toLowerCase().includes(q) ?? false) ||
          (c.razonSocial?.toLowerCase().includes(q) ?? false),
      )
    : comitentes;

  return (
    <div className="flex flex-col gap-3">
      {/* Buscador */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por comitente o nombre..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all placeholder:text-slate-400"
        />
      </div>

      {/* Contador */}
      <p className="text-[10px] text-slate-400 font-medium">
        Mostrando {filtered.length} de {comitentes.length} comitente{comitentes.length !== 1 ? "s" : ""}
      </p>

      {/* Sin resultados */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-400 italic">No se encontraron comitentes para esa búsqueda.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["N° Comitente", "Cliente", "Productor", "ARS", "USD Cable", "USD MEP", "Holdings", ""].map((h, i) => (
                  <th
                    key={h || `col-${i}`}
                    className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ${i < 3 || i === 7 ? "text-left" : "text-right"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const isEditingData       = editId === c.id;
                const isEditingSaldos     = editSaldosId === c.id;
                const isEditingProductor  = editingProductorId === c.id;
                const displayProductor    = productorOverrides[c.id] ?? c.productor;

                return (
                  <React.Fragment key={c.id}>
                    <tr
                      className={`border-b border-slate-50 last:border-0 transition-colors ${
                        isEditingData || isEditingSaldos
                          ? "bg-slate-50"
                          : c.activo
                          ? "bg-white hover:bg-slate-50/60"
                          : "bg-slate-50 opacity-60"
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-slate-700 font-semibold">{c.nroComitente}</td>
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`${baseUrl}/comitentes/${c.id}`}
                          className="text-slate-800 hover:text-blue-600 transition-colors"
                        >
                          {c.nombre ?? c.razonSocial}
                        </Link>
                        {c.nombre && c.razonSocial && (
                          <span className="block text-[10px] text-slate-400 font-normal">{c.razonSocial}</span>
                        )}
                        {!c.activo && (
                          <span className="ml-1 text-[10px] text-slate-400 font-bold">(inactivo)</span>
                        )}
                      </td>

                      {/* Productor cell — badge normal o editor inline */}
                      <td className="px-4 py-3">
                        {isEditingProductor ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              <select
                                value={pendingProductor}
                                onChange={(e) => setPendingProductor(e.target.value as ProductorInversion)}
                                disabled={saving}
                                className="border border-slate-200 rounded-lg px-2 py-1 text-[11px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                              >
                                {PRODUCTORES.map((p) => (
                                  <option key={p} value={p}>{PRODUCTOR_LABEL[p]}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white transition-colors"
                              >
                                {saving ? "…" : "Guardar"}
                              </button>
                              <button
                                type="button"
                                onClick={cancelProductorEdit}
                                disabled={saving}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-700 transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                            {productorError && (
                              <p className="text-[10px] text-rose-600">{productorError}</p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${PRODUCTOR_CLS[displayProductor]}`}>
                              {PRODUCTOR_LABEL[displayProductor]}
                            </span>
                            <button
                              type="button"
                              onClick={() => openProductorEdit(c)}
                              className="text-[10px] text-slate-400 hover:text-slate-600 font-bold transition-colors"
                            >
                              Editar
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                        {c.saldoARS !== 0 ? `$ ${fmt(c.saldoARS)}` : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                        {c.saldoUSDCable !== 0 ? `USD ${fmt(c.saldoUSDCable)}` : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                        {c.saldoUSDMep !== 0 ? `USD ${fmt(c.saldoUSDMep)}` : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600 font-medium">
                        {c.holdingsCount}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            href={isEditingData ? `${baseUrl}?tab=clientes` : `${baseUrl}?tab=clientes&editId=${c.id}`}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                              isEditingData
                                ? "bg-amber-100 text-amber-700"
                                : "text-slate-500 hover:bg-amber-50 hover:text-amber-600"
                            }`}
                          >
                            Editar
                          </Link>
                          <Link
                            href={isEditingSaldos ? `${baseUrl}?tab=clientes` : `${baseUrl}?tab=clientes&editSaldosId=${c.id}`}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                              isEditingSaldos
                                ? "bg-emerald-100 text-emerald-700"
                                : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"
                            }`}
                          >
                            Saldos
                          </Link>
                          <DeleteComitenteButton id={c.id} cuentaInversionId={cuentaInversionId} />
                        </div>
                      </td>
                    </tr>
                    {isEditingData && (
                      <tr className="bg-amber-50/50">
                        <td colSpan={8} className="px-4 py-4">
                          <EditComitenteForm
                            id={c.id}
                            cuentaInversionId={cuentaInversionId}
                            nroComitente={c.nroComitente}
                            nombre={c.nombre ?? ""}
                            razonSocial={c.razonSocial}
                            productor={c.productor}
                            notas={c.notas}
                            activo={c.activo}
                            esPropioBYG={c.esPropioBYG}
                            cancelHref={`${baseUrl}?tab=clientes`}
                            productores={productores}
                          />
                        </td>
                      </tr>
                    )}
                    {isEditingSaldos && (
                      <tr className="bg-emerald-50/30">
                        <td colSpan={8} className="px-4 py-4">
                          <EditSaldosForm
                            comitenteId={c.id}
                            cuentaInversionId={cuentaInversionId}
                            saldoARS={c.saldoARS}
                            saldoUSDCable={c.saldoUSDCable}
                            saldoUSDMep={c.saldoUSDMep}
                            cancelHref={`${baseUrl}?tab=clientes`}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
