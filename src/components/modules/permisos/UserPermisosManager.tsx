"use client";

import { useActionState, useState } from "react";
import { setUserPermissionOverride, applyRolePreset, PERMISSION_KEYS } from "@/app/(dashboard)/permisos/actions";
import { Shield, ShieldOff, Trash2 } from "lucide-react";

type OverrideRow = {
  id: string;
  concedido: boolean;
  modulo: string;
  accion: string;
};

type UserRow = {
  id: string;
  name: string | null;
  role: string;
  overrides: OverrideRow[];
};

export function UserPermisosManager({ users }: { users: UserRow[] }) {
  return (
    <div className="flex flex-col gap-6">
      {users.map((u) => (
        <UserCard key={u.id} user={u} />
      ))}
    </div>
  );
}

function UserCard({ user }: { user: UserRow }) {
  const [presetState, presetAction, presetPending] = useActionState(applyRolePreset, null);
  const [overrideState, overrideAction, overridePending] = useActionState(setUserPermissionOverride, null);

  const grantedKeys = new Set(user.overrides.filter(o => o.concedido).map(o => `${o.modulo}:${o.accion}`));
  const revokedKeys = new Set(user.overrides.filter(o => !o.concedido).map(o => `${o.modulo}:${o.accion}`));

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/40">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-800">{user.name ?? "—"}</span>
          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
            user.role === "ADMIN"    ? "bg-slate-900 text-white" :
            user.role === "SOCIO"    ? "bg-blue-100 text-blue-700" :
            user.role === "EMPLEADO" ? "bg-amber-100 text-amber-700" :
                                       "bg-slate-100 text-slate-500"
          }`}>{user.role}</span>
        </div>
        <div className="flex items-center gap-2">
          {user.role !== "ADMIN" && (
            <>
              {(user.role === "SOCIO") && (
                <form action={presetAction}>
                  <input type="hidden" name="userId" value={user.id} />
                  <input type="hidden" name="preset" value="francisco_socio" />
                  <button type="submit" disabled={presetPending}
                    className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50">
                    Aplicar perfil Francisco
                  </button>
                </form>
              )}
              {(user.role === "EMPLEADO") && (
                <form action={presetAction}>
                  <input type="hidden" name="userId" value={user.id} />
                  <input type="hidden" name="preset" value="augusto_empleado" />
                  <button type="submit" disabled={presetPending}
                    className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50">
                    Aplicar perfil Augusto/Nanu
                  </button>
                </form>
              )}
              <form action={presetAction}>
                <input type="hidden" name="userId" value={user.id} />
                <input type="hidden" name="preset" value="clear" />
                <button type="submit" disabled={presetPending}
                  className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-50">
                  Limpiar overrides
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {user.role === "ADMIN" ? (
        <p className="px-5 py-3 text-[11px] text-slate-400 italic">Acceso total — no se pueden restringir admins</p>
      ) : (
        <div className="px-5 py-4 flex flex-col gap-3">
          {(presetState?.error || overrideState?.error) && (
            <p className="text-[11px] text-red-500 font-semibold">{presetState?.error ?? overrideState?.error}</p>
          )}

          {/* Current overrides */}
          {user.overrides.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Overrides activos</p>
              <div className="flex flex-wrap gap-1.5">
                {user.overrides.map((o) => (
                  <div key={o.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                    o.concedido ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-600"
                  }`}>
                    {o.concedido ? <Shield size={10} /> : <ShieldOff size={10} />}
                    {o.modulo}:{o.accion}
                    <form action={overrideAction} className="inline">
                      <input type="hidden" name="userId"  value={user.id} />
                      <input type="hidden" name="modulo"  value={o.modulo} />
                      <input type="hidden" name="accion"  value={o.accion} />
                      <input type="hidden" name="concedido" value="remove" />
                      <button type="submit" disabled={overridePending} className="opacity-50 hover:opacity-100 transition-opacity ml-1">
                        <Trash2 size={9} />
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add override */}
          <AddOverrideForm userId={user.id} action={overrideAction} pending={overridePending} />

          {/* Quick reference */}
          <div className="flex flex-wrap gap-1 mt-1">
            {PERMISSION_KEYS.slice(0, 8).map((pk) => {
              const isGranted = grantedKeys.has(pk.key);
              const isRevoked = revokedKeys.has(pk.key);
              const cls = isRevoked ? "bg-red-50 text-red-500 border-red-200" :
                          isGranted ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                      "bg-slate-50 text-slate-400 border-slate-200";
              return (
                <span key={pk.key} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${cls}`}>
                  {pk.key}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AddOverrideForm({
  userId,
  action,
  pending,
}: {
  userId: string;
  action: (payload: FormData) => void;
  pending: boolean;
}) {
  const [selectedKey, setSelectedKey] = useState("");

  const [modulo, accion] = selectedKey.split(":");

  return (
    <details className="group">
      <summary className="text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">
        + Agregar override manual
      </summary>
      <form action={action} className="mt-3 flex flex-wrap gap-2 items-end">
        <input type="hidden" name="userId"  value={userId} />
        <input type="hidden" name="modulo"  value={modulo ?? ""} />
        <input type="hidden" name="accion"  value={accion ?? ""} />
        <select
          value={selectedKey}
          onChange={(e) => setSelectedKey(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="">Seleccionar permiso…</option>
          {PERMISSION_KEYS.map((pk) => (
            <option key={pk.key} value={pk.key}>{pk.label}</option>
          ))}
        </select>
        <select name="concedido" className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
          <option value="true">Conceder</option>
          <option value="false">Revocar</option>
        </select>
        <button
          type="submit"
          disabled={pending || !selectedKey}
          className="px-4 py-2 rounded-lg bg-byg-accent text-white text-xs font-bold hover:bg-blue-500 transition-colors disabled:opacity-50"
        >
          Guardar
        </button>
      </form>
    </details>
  );
}
