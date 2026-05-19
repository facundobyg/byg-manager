"use client";

import { useState, useEffect, useActionState } from "react";
import { User, Pencil, Trash2, UserX, UserCheck, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  editarCliente,
  darDeBajaCliente,
  reactivarCliente,
  eliminarCliente,
} from "@/app/(dashboard)/clientes/actions";
import type { ClienteWithCount } from "./ClienteGrid";

export function ClienteCard({ cliente }: { cliente: ClienteWithCount }) {
  const router = useRouter();
  const [editing,       setEditing]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [editState,      editAction]      = useActionState(editarCliente,      null);
  const [bajaState,      bajaAction]      = useActionState(darDeBajaCliente,   null);
  const [reactivarState, reactivarAction] = useActionState(reactivarCliente,   null);
  const [deleteState,    deleteAction]    = useActionState(eliminarCliente,     null);

  const totalRels =
    cliente._count.CuentaCorriente +
    cliente._count.PlazoFijo +
    cliente._count.OperacionCambio +
    cliente._count.CustodiaCliente;

  useEffect(() => {
    if (editState?.ok) {
      setEditing(false);
      router.refresh();
    }
  }, [editState]);

  useEffect(() => {
    if (bajaState?.ok || reactivarState?.ok) router.refresh();
  }, [bajaState, reactivarState]);

  useEffect(() => {
    if (deleteState?.ok) router.refresh();
    if (deleteState?.error) setConfirmDelete(false);
  }, [deleteState]);

  return (
    <div
      className={`bg-white border rounded-2xl shadow-sm transition-all flex flex-col ${
        !cliente.activo
          ? "border-slate-100"
          : "border-slate-200 hover:shadow-md"
      }`}
    >
      {editing ? (
        /* ── Edit form ── */
        <form action={editAction} className="p-4 flex flex-col gap-3">
          <input type="hidden" name="id" value={cliente.id} />

          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
              Editar Cliente
            </span>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X size={14} />
            </button>
          </div>

          <input
            name="nombre"
            defaultValue={cliente.nombre}
            required
            placeholder="Nombre"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            name="email"
            defaultValue={cliente.email ?? ""}
            type="email"
            placeholder="Email (opcional)"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            name="telefono"
            defaultValue={cliente.telefono ?? ""}
            placeholder="Teléfono (opcional)"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            name="notas"
            defaultValue={cliente.notas ?? ""}
            rows={2}
            placeholder="Notas (opcional)"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          {editState?.error && (
            <p className="text-xs text-red-500">{editState.error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 text-sm font-bold transition-colors"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 border border-slate-200 text-slate-500 rounded-xl py-2 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* ── View mode ── */}
          <Link
            href={`/clientes/${cliente.id}`}
            className={`block p-6 ${!cliente.activo ? "opacity-60" : ""}`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-xl ${
                  cliente.activo
                    ? "bg-blue-50 text-blue-600"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                <User size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 tracking-tight truncate">
                    {cliente.nombre}
                  </h3>
                  {!cliente.activo && (
                    <span className="text-[9px] font-black text-orange-400 uppercase shrink-0">
                      Inactivo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate">
                  {cliente.email || "Sin email registrado"}
                </p>
              </div>
            </div>
          </Link>

          {/* ── Actions bar ── */}
          <div className="border-t border-slate-100 px-4 py-2 flex items-center justify-between gap-2">
            <div className="flex gap-1">
              {/* Edit */}
              <button
                onClick={() => setEditing(true)}
                title="Editar"
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Pencil size={14} />
              </button>

              {/* Baja / Reactivar */}
              {cliente.activo ? (
                <form action={bajaAction}>
                  <input type="hidden" name="id" value={cliente.id} />
                  <button
                    type="submit"
                    title="Dar de baja"
                    className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <UserX size={14} />
                  </button>
                </form>
              ) : (
                <form action={reactivarAction}>
                  <input type="hidden" name="id" value={cliente.id} />
                  <button
                    type="submit"
                    title="Reactivar"
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <UserCheck size={14} />
                  </button>
                </form>
              )}

              {/* Delete (only if no related records) */}
              {totalRels === 0 && !confirmDelete && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  title="Eliminar definitivamente"
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}

              {confirmDelete && (
                <div className="flex items-center gap-1">
                  <form action={deleteAction}>
                    <input type="hidden" name="id" value={cliente.id} />
                    <button
                      type="submit"
                      className="px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Confirmar
                    </button>
                  </form>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Relation badges */}
            <div className="flex gap-1.5 text-[10px] text-slate-300 font-bold">
              {cliente._count.CuentaCorriente > 0 && (
                <span title="Cuentas Corrientes">CC:{cliente._count.CuentaCorriente}</span>
              )}
              {cliente._count.PlazoFijo > 0 && (
                <span title="Plazos Fijos">PF:{cliente._count.PlazoFijo}</span>
              )}
              {cliente._count.OperacionCambio > 0 && (
                <span title="Operaciones de Cambio">OC:{cliente._count.OperacionCambio}</span>
              )}
            </div>
          </div>

          {/* Error feedback */}
          {(bajaState?.error || reactivarState?.error || deleteState?.error) && (
            <div className="px-4 pb-3 text-xs text-red-500 font-medium">
              {bajaState?.error || reactivarState?.error || deleteState?.error}
            </div>
          )}
        </>
      )}
    </div>
  );
}
