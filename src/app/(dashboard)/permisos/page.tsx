import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN:    "Admin",
  SOCIO:    "Socio",
  EMPLEADO: "Empleado",
  CLIENTE:  "Cliente",
};

const ROLE_CLS: Record<UserRole, string> = {
  ADMIN:    "bg-slate-900 text-white",
  SOCIO:    "bg-blue-100 text-blue-700",
  EMPLEADO: "bg-amber-100 text-amber-700",
  CLIENTE:  "bg-slate-100 text-slate-600",
};

const ROLE_ACCESS: Record<UserRole, string> = {
  ADMIN:    "Acceso total",
  SOCIO:    "Ve todo / edición según módulo",
  EMPLEADO: "Acceso limitado",
  CLIENTE:  "Portal cliente",
};

type Cell = { value: string; cls: string };
const OK:   Cell = { value: "Total",    cls: "bg-emerald-100 text-emerald-700" };
const PART: Cell = { value: "Parcial",  cls: "bg-amber-100 text-amber-700"   };
const NO:   Cell = { value: "No",       cls: "bg-slate-100 text-slate-400"   };
const EMP:  Cell = { value: "Según permiso", cls: "bg-blue-50 text-blue-600" };

const MATRIZ: { modulo: string; facu: Cell; francisco: Cell; augusto: Cell; empleados: Cell }[] = [
  { modulo: "Caja",         facu: OK,   francisco: NO,   augusto: PART, empleados: EMP  },
  { modulo: "Clientes",     facu: OK,   francisco: PART, augusto: PART, empleados: EMP  },
  { modulo: "CC",           facu: OK,   francisco: PART, augusto: PART, empleados: EMP  },
  { modulo: "PF",           facu: OK,   francisco: PART, augusto: PART, empleados: EMP  },
  { modulo: "Carteras",     facu: OK,   francisco: OK,   augusto: NO,   empleados: NO   },
  { modulo: "Operaciones",  facu: OK,   francisco: OK,   augusto: NO,   empleados: NO   },
  { modulo: "Reportes",     facu: OK,   francisco: PART, augusto: NO,   empleados: NO   },
  { modulo: "Backup",       facu: OK,   francisco: NO,   augusto: NO,   empleados: NO   },
  { modulo: "Auditoría",    facu: OK,   francisco: NO,   augusto: NO,   empleados: NO   },
];

export default async function PermisosPage() {
  await requirePermission("usuarios:leer");
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true, activo: true },
  });

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Administración</p>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Permisos</h1>
        <p className="text-sm text-slate-400 font-medium mt-1">Control de accesos por módulo</p>
      </header>

      {/* Users table */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Usuarios</h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Usuario", "Email", "Rol", "Estado", "Acceso sugerido"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ${i >= 2 ? "text-center" : "text-left"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">Sin usuarios</td>
                </tr>
              ) : users.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-bold text-slate-800">{u.name}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono">{u.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${ROLE_CLS[u.role]}`}>
                      {ROLE_LABEL[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${u.activo ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600 font-medium">{ROLE_ACCESS[u.role]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Matriz futura */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Matriz de permisos futura</h2>
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Planificada</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Módulo", "Facu / Admin", "Francisco", "Augusto", "Empleados"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ${i === 0 ? "text-left" : "text-center"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIZ.map(({ modulo, facu, francisco, augusto, empleados }) => (
                <tr key={modulo} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-bold text-slate-700">{modulo}</td>
                  {[facu, francisco, augusto, empleados].map((cell, i) => (
                    <td key={i} className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${cell.cls}`}>
                        {cell.value}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-slate-400 font-medium text-right">
          Esta matriz es indicativa. Los permisos reales se configuran en la tabla Permiso/RolPermiso.
        </p>
      </section>
    </div>
  );
}
