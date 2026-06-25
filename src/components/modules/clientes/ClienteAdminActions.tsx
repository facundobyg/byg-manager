"use client";

import { useState, useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Trash2, AlertTriangle } from "lucide-react";
import { darDeBajaCliente, eliminarCliente, eliminarClienteConDatos } from "@/app/(dashboard)/clientes/actions";

export function ClienteAdminActions({
  clienteId, canEditar, canEliminar,
}: { clienteId: string; canEditar: boolean; canEliminar: boolean }) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmForce,  setConfirmForce]  = useState(false);
  const [archiveState, archiveAction, archivePending]     = useActionState(darDeBajaCliente, null);
  const [deleteState,  deleteAction,  deletePending]      = useActionState(eliminarCliente, null);
  const [forceState,   forceAction,   forcePending]       = useActionState(eliminarClienteConDatos, null);

  useEffect(() => { if (archiveState?.ok) { router.push("/clientes/cc"); router.refresh(); } }, [archiveState, router]);
  useEffect(() => { if (deleteState?.ok)  { window.location.href = "/clientes/cc"; } }, [deleteState]);
  useEffect(() => { if (forceState?.ok)   { window.location.href = "/clientes/cc"; } }, [forceState]);

  if (!canEditar && !canEliminar) return null;

  return (
    <div className="flex flex-col items-end gap-2 shrink-0">
      <div className="flex items-center gap-2">
        {canEditar && (
          <form action={archiveAction}>
            <input type="hidden" name="id" value={clienteId} />
            <button
              type="submit"
              disabled={archivePending}
              className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors uppercase tracking-wider border border-amber-200 disabled:opacity-50"
            >
              <Archive size={11} />
              {archivePending ? "Archivando…" : "Archivar"}
            </button>
          </form>
        )}

        {!canEliminar ? null : !confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors uppercase tracking-wider border border-red-200"
          >
            <Trash2 size={11} />
            Eliminar
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-red-500 font-bold mr-1">¿Seguro?</span>
            <form action={deleteAction}>
              <input type="hidden" name="id" value={clienteId} />
              <button
                type="submit"
                disabled={deletePending}
                className="inline-flex items-center text-[10px] font-black px-2.5 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors uppercase tracking-wider disabled:opacity-50"
              >
                {deletePending ? "…" : "Confirmar"}
              </button>
            </form>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              No
            </button>
          </div>
        )}
      </div>

      {deleteState?.error && (
        <div className="flex flex-col items-end gap-1.5 max-w-[280px]">
          <p className="text-[10px] text-red-500 font-semibold text-right leading-tight">
            {deleteState.error}
          </p>
          {deleteState.canForce && !confirmForce && (
            <button
              onClick={() => setConfirmForce(true)}
              className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-800 transition-colors uppercase tracking-wider"
            >
              <AlertTriangle size={10} />
              Eliminar con datos
            </button>
          )}
          {deleteState.canForce && confirmForce && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-2.5 flex flex-col gap-2">
              <p className="text-[10px] font-black text-red-700 uppercase tracking-wide flex items-center gap-1">
                <AlertTriangle size={10} /> Eliminación total irreversible
              </p>
              <p className="text-[10px] text-red-600 leading-tight">
                Se borrarán CC, PF y todos los movimientos. No se puede deshacer.
              </p>
              <div className="flex gap-1.5">
                <form action={forceAction}>
                  <input type="hidden" name="id" value={clienteId} />
                  <button
                    type="submit"
                    disabled={forcePending}
                    className="text-[10px] font-black px-2.5 py-1.5 rounded-lg bg-red-700 text-white hover:bg-red-900 transition-colors uppercase tracking-wider disabled:opacity-50"
                  >
                    {forcePending ? "Eliminando…" : "Confirmar"}
                  </button>
                </form>
                <button
                  onClick={() => setConfirmForce(false)}
                  className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
              {forceState?.error && (
                <p className="text-[10px] text-red-600 font-semibold">{forceState.error}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
