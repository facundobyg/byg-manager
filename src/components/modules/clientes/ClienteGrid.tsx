import { ClienteCard } from "./ClienteCard";

interface Count {
  CuentaCorriente: number;
  PlazoFijo:       number;
  OperacionCambio: number;
  CustodiaCliente: number;
}

export interface ClienteWithCount {
  id:        string;
  nombre:    string;
  email?:    string | null;
  telefono?: string | null;
  notas?:    string | null;
  activo:    boolean;
  _count:    Count;
}

export function ClienteGrid({ clientes }: { clientes: ClienteWithCount[] }) {
  const activos   = clientes.filter((c) => c.activo);
  const inactivos = clientes.filter((c) => !c.activo);

  if (!clientes.length) {
    return (
      <div className="p-20 text-center bg-white border border-slate-100 border-dashed rounded-2xl text-slate-400 flex flex-col items-center gap-2">
        <p className="font-medium text-sm">No hay clientes cargados en el sistema.</p>
        <p className="text-xs uppercase font-black tracking-widest text-slate-300">Módulo Base</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {activos.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Activos ({activos.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activos.map((c) => (
              <ClienteCard key={c.id} cliente={c} />
            ))}
          </div>
        </section>
      )}

      {inactivos.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Inactivos / Dados de baja ({inactivos.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inactivos.map((c) => (
              <ClienteCard key={c.id} cliente={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
