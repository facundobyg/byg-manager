import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { getLastTcMep } from "@/lib/services/config.service";
import { CrearHonorarioForm } from "@/components/modules/honorarios/CrearHonorarioForm";
import { RegistrarMesForm } from "@/components/modules/honorarios/RegistrarMesForm";

export default async function HonorariosPage() {
  const session = await auth();
  const role = (session?.user as { role?: UserRole })?.role;
  if (!session?.user || !["ADMIN", "SOCIO"].includes(role ?? "")) {
    redirect("/inicio");
  }
  const isAdmin = role === "ADMIN";

  const [honorarios, comitentes, clientes, lastTcMep] = await Promise.all([
    prisma.honorarioBYG.findMany({
      where: { activo: true },
      include: {
        HonorarioMes: {
          orderBy: { mes: "desc" },
          take: 24,
        },
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.comitenteInversion.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.cliente.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    getLastTcMep(),
  ]);

  const pendienteCount = honorarios.reduce((acc, h) =>
    acc + h.HonorarioMes.filter((m) => m.estado === "PENDIENTE").length, 0);
  const cobradoCount   = honorarios.reduce((acc, h) =>
    acc + h.HonorarioMes.filter((m) => m.estado === "COBRADO").length, 0);

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Header */}
      <header>
        <p className="text-[10px] font-black text-byg-accent uppercase tracking-[0.3em]">Interno</p>
        <h1 className="text-4xl font-black text-byg-text tracking-tight">Honorarios BYG</h1>
        <p className="text-sm text-byg-muted font-medium mt-1">
          Módulo interno — gestión de honorarios sobre carteras administradas
        </p>
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30">
          <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
            Solo visible para Socios y Administradores · No incluido en PDFs
          </span>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-byg-surface rounded-2xl border border-byg-border p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">Honorarios activos</p>
          <p className="text-3xl font-black tabular-nums font-mono text-byg-text mt-1">{honorarios.length}</p>
        </div>
        <div className="bg-byg-surface rounded-2xl border border-byg-border border-l-[5px] border-l-amber-400 p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Meses pendientes</p>
          <p className="text-3xl font-black tabular-nums font-mono text-amber-400 mt-1">{pendienteCount}</p>
        </div>
        <div className="bg-byg-surface rounded-2xl border border-byg-border border-l-[5px] border-l-emerald-400 p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Meses cobrados</p>
          <p className="text-3xl font-black tabular-nums font-mono text-emerald-400 mt-1">{cobradoCount}</p>
        </div>
        <div className="bg-byg-surface rounded-2xl border border-byg-border p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-byg-muted">TC MEP último</p>
          <p className="text-3xl font-black tabular-nums font-mono text-byg-text mt-1">
            {lastTcMep ? `$ ${lastTcMep.valor.toFixed(2)}` : "—"}
          </p>
          {lastTcMep && (
            <p className="text-[10px] text-byg-muted mt-0.5">{lastTcMep.fecha}</p>
          )}
        </div>
      </div>

      {/* Honorarios */}
      {honorarios.length === 0 ? (
        <div className="rounded-2xl border border-byg-border bg-byg-surface p-8 text-center">
          <p className="text-sm font-bold text-byg-muted">Sin honorarios configurados.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-byg-muted">Detalle por honorario</h2>
          {honorarios.map((h) => (
            <RegistrarMesForm
              key={h.id}
              honorarioId={h.id}
              nombre={h.nombre}
              pctAnual={Number(h.porcentajeAnual)}
              monedaBase={h.moneda}
              tcMepActual={lastTcMep?.valor ?? null}
              meses={h.HonorarioMes.map((m) => ({
                id:           m.id,
                mes:          m.mes,
                saldoCartera: m.saldoCartera !== null ? Number(m.saldoCartera) : null,
                monedaSaldo:  m.monedaSaldo,
                porcentaje:   Number(m.porcentaje),
                honorarioUSD: m.honorarioUSD !== null ? Number(m.honorarioUSD) : null,
                tcMep:        m.tcMep !== null ? Number(m.tcMep) : null,
                honorarioARS: m.honorarioARS !== null ? Number(m.honorarioARS) : null,
                estado:       m.estado,
                notas:        m.notas,
              }))}
            />
          ))}
        </div>
      )}

      {/* Crear honorario */}
      {isAdmin && (
        <div className="flex flex-col gap-3 pt-4 border-t border-byg-border/50">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-byg-muted">Crear nuevo honorario</h2>
          <CrearHonorarioForm
            comitentes={comitentes}
            clientes={clientes}
          />
        </div>
      )}
    </div>
  );
}
